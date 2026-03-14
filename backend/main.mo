import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Int "mo:core/Int";

actor {
  type Task = {
    id : Nat;
    title : Text;
    description : ?Text;
    dueDate : ?Int;
    priority : Text;
    projectId : ?Nat;
    completed : Bool;
    owner : Principal;
    createdAt : Int;
    updatedAt : Int;
  };

  type Project = {
    id : Nat;
    name : Text;
    owner : Principal;
    createdAt : Int;
  };

  type SortBy = {
    #dueDateAsc;
    #dueDateDesc;
    #priorityAsc;
    #priorityDesc;
    #createdAsc;
    #createdDesc;
    #alphaAsc;
    #alphaDesc;
  };

  type TaskFilter = {
    view : ?{ #today; #upcoming; #all };
    projectId : ?Nat;
    priority : ?Text;
    status : ?{ #active; #completed };
    searchQuery : ?Text;
    sortBy : ?SortBy;
  };

  type PaginationResult<T> = {
    items : [T];
    totalItems : Nat;
    totalPages : Nat;
    currentPage : Nat;
    hasNextPage : Bool;
    hasPrevPage : Bool;
  };

  type User = {
    displayName : Text;
  };

  type TaskExport = {
    id : Nat;
    title : Text;
    description : ?Text;
    dueDate : ?Int;
    priority : Text;
    projectName : ?Text;
    completed : Bool;
    createdAt : Int;
  };

  // State
  var nextTaskId : Nat = 1;
  var nextProjectId : Nat = 1;
  var tasks : Map.Map<Nat, Task> = Map.empty<Nat, Task>();
  var projects : Map.Map<Nat, Project> = Map.empty<Nat, Project>();
  var users : Map.Map<Principal, User> = Map.empty<Principal, User>();
  var userTaskCounts : Map.Map<Principal, Nat> = Map.empty<Principal, Nat>();
  var userProjectCounts : Map.Map<Principal, Nat> = Map.empty<Principal, Nat>();

  // Constants
  let MAX_TASKS_PER_USER : Nat = 1000;
  let MAX_PROJECTS_PER_USER : Nat = 50;

  // Helper Functions
  func requireAuth(caller : Principal) {
    if (caller.isAnonymous()) {
      Runtime.trap("Not authenticated");
    };
  };

  func requireOwner(caller : Principal, owner : Principal) {
    if (caller != owner) {
      Runtime.trap("Not authorized");
    };
  };

  func validateFieldLength(value : Text, fieldName : Text, minLen : Nat, maxLen : Nat) {
    if (value.size() < minLen) {
      Runtime.trap(fieldName # " cannot be empty");
    };
    if (value.size() > maxLen) {
      Runtime.trap(fieldName # " too long (max " # maxLen.toText() # " characters)");
    };
  };

  func validateOptionalFieldLength(value : ?Text, fieldName : Text, maxLen : Nat) {
    switch (value) {
      case (?v) {
        if (v.size() > maxLen) {
          Runtime.trap(fieldName # " too long (max " # maxLen.toText() # " characters)");
        };
      };
      case (null) {};
    };
  };

  func validatePriority(priority : Text) {
    if (priority != "high" and priority != "medium" and priority != "low") {
      Runtime.trap("Invalid priority");
    };
  };

  func validateProjectOwnership(caller : Principal, projectId : ?Nat) {
    switch (projectId) {
      case (?pid) {
        switch (projects.get(pid)) {
          case (?project) {
            if (project.owner != caller) {
              Runtime.trap("Project not found");
            };
          };
          case (null) { Runtime.trap("Project not found") };
        };
      };
      case (null) {};
    };
  };

  func getUserTaskCount(owner : Principal) : Nat {
    switch (userTaskCounts.get(owner)) {
      case (?count) { count };
      case (null) { 0 };
    };
  };

  func getUserProjectCount(owner : Principal) : Nat {
    switch (userProjectCounts.get(owner)) {
      case (?count) { count };
      case (null) { 0 };
    };
  };

  func validatePagination(page : ?Nat, limit : ?Nat) : (Nat, Nat) {
    let validatedPage = switch (page) {
      case (?p) {
        if (p == 0) {
          Runtime.trap("Page must be greater than 0");
        };
        if (p > 10000) {
          Runtime.trap("Page number too large (max 10000)");
        };
        p;
      };
      case (null) { 1 };
    };
    let validatedLimit = switch (limit) {
      case (?l) {
        if (l == 0) {
          Runtime.trap("Limit must be greater than 0");
        };
        if (l > 100) {
          Runtime.trap("Limit too large (max 100)");
        };
        l;
      };
      case (null) { 10 };
    };
    (validatedPage, validatedLimit);
  };

  func paginateArray<T>(items : [T], page : Nat, limit : Nat) : PaginationResult<T> {
    let totalItems = items.size();
    let totalPages = if (totalItems == 0) { 1 } else {
      (totalItems + limit - 1) / limit;
    };
    let currentPage = Nat.min(Nat.max(page, 1), totalPages);
    let startIndex = (currentPage - 1) * limit;
    let endIndex = Nat.min(startIndex + limit, totalItems);

    {
      items = if (startIndex >= totalItems) { [] } else {
        items.sliceToArray(startIndex, endIndex);
      };
      totalItems;
      totalPages;
      currentPage;
      hasNextPage = currentPage < totalPages;
      hasPrevPage = currentPage > 1;
    };
  };

  // Date helper: Get start of day in nanoseconds
  func getStartOfDay(timestamp : Int) : Int {
    let nsPerDay = Time.toNanoseconds(#days 1);
    (timestamp / nsPerDay) * nsPerDay;
  };

  // Check if timestamp is today
  func isToday(timestamp : Int) : Bool {
    getStartOfDay(timestamp) == getStartOfDay(Time.now());
  };

  // Check if timestamp is after today (any future date)
  func isUpcoming(timestamp : Int) : Bool {
    let tomorrowStart = getStartOfDay(Time.now()) + Time.toNanoseconds(#days 1);
    timestamp >= tomorrowStart;
  };

  // Filter tasks by owner and TaskFilter
  func filterTasks(caller : Principal, filter : TaskFilter) : [Task] {
    validateOptionalFieldLength(filter.searchQuery, "Search query", 100);

    let allTasks = tasks.values().toArray();

    allTasks.filter(
      func(task) {
        // Must be owner
        if (task.owner != caller) {
          return false;
        };

        // Apply view filter
        switch (filter.view) {
          case (?#today) {
            switch (task.dueDate) {
              case (?due) {
                if (not isToday(due)) {
                  return false;
                };
              };
              case (null) { return false };
            };
          };
          case (?#upcoming) {
            switch (task.dueDate) {
              case (?due) {
                if (not isUpcoming(due)) {
                  return false;
                };
              };
              case (null) { return false };
            };
          };
          case (?#all) {};
          case (null) {};
        };

        // Apply projectId filter
        switch (filter.projectId) {
          case (?pid) {
            switch (task.projectId) {
              case (?taskPid) {
                if (taskPid != pid) {
                  return false;
                };
              };
              case (null) { return false };
            };
          };
          case (null) {};
        };

        // Apply priority filter
        switch (filter.priority) {
          case (?p) {
            if (task.priority != p) {
              return false;
            };
          };
          case (null) {};
        };

        // Apply status filter
        switch (filter.status) {
          case (?#active) {
            if (task.completed) {
              return false;
            };
          };
          case (?#completed) {
            if (not task.completed) {
              return false;
            };
          };
          case (null) {};
        };

        // Apply search filter (case-insensitive title contains)
        switch (filter.searchQuery) {
          case (?searchText) {
            if (searchText.size() > 0) {
              let lowerSearch = searchText.toLower();
              let lowerTitle = task.title.toLower();
              if (not lowerTitle.contains(#text lowerSearch)) {
                return false;
              };
            };
          };
          case (null) {};
        };

        true;
      }
    );
  };

  // Priority comparison helper
  func priorityToNum(p : Text) : Int {
    if (p == "high") {
      return 3;
    };
    if (p == "medium") {
      return 2;
    };
    1; // low
  };

  // Compare optional Int values (nulls sorted last)
  func compareOptInt(a : ?Int, b : ?Int) : { #less; #equal; #greater } {
    switch (a, b) {
      case (null, null) { #equal };
      case (null, ?_) { #greater };
      case (?_, null) { #less };
      case (?av, ?bv) { Int.compare(av, bv) };
    };
  };

  // Sort tasks by sortBy option
  func sortTasks(taskList : [Task], sortBy : ?SortBy) : [Task] {
    taskList.sort(
      func(a, b) {
        switch (sortBy) {
          case (?#dueDateAsc) { compareOptInt(a.dueDate, b.dueDate) };
          case (?#dueDateDesc) { compareOptInt(b.dueDate, a.dueDate) };
          case (?#priorityAsc) {
            Int.compare(priorityToNum(a.priority), priorityToNum(b.priority));
          };
          case (?#priorityDesc) {
            Int.compare(priorityToNum(b.priority), priorityToNum(a.priority));
          };
          case (?#createdAsc) { Int.compare(a.createdAt, b.createdAt) };
          case (?#createdDesc) { Int.compare(b.createdAt, a.createdAt) };
          case (?#alphaAsc) { a.title.compare(b.title) };
          case (?#alphaDesc) { b.title.compare(a.title) };
          case (null) { #equal };
        };
      }
    );
  };

  // Task CRUD Operations
  public shared ({ caller }) func createTask(
    title : Text,
    description : ?Text,
    dueDate : ?Int,
    priority : Text,
    projectId : ?Nat,
  ) : async Task {
    requireAuth(caller);

    if (getUserTaskCount(caller) >= MAX_TASKS_PER_USER) {
      Runtime.trap("Maximum of 1000 tasks reached");
    };

    validateFieldLength(title, "Title", 1, 255);
    validateOptionalFieldLength(description, "Description", 1000);
    validatePriority(priority);
    validateProjectOwnership(caller, projectId);

    let now = Time.now();
    let task : Task = {
      id = nextTaskId;
      title;
      description;
      dueDate;
      priority;
      projectId;
      completed = false;
      owner = caller;
      createdAt = now;
      updatedAt = now;
    };

    tasks.add(nextTaskId, task);
    nextTaskId += 1;
    userTaskCounts.add(caller, getUserTaskCount(caller) + 1);
    task;
  };

  public shared ({ caller }) func updateTask(
    id : Nat,
    title : Text,
    description : ?Text,
    dueDate : ?Int,
    priority : Text,
    projectId : ?Nat,
  ) : async Task {
    requireAuth(caller);

    validateFieldLength(title, "Title", 1, 255);
    validateOptionalFieldLength(description, "Description", 1000);
    validatePriority(priority);

    switch (tasks.get(id)) {
      case (?task) {
        requireOwner(caller, task.owner);
        validateProjectOwnership(caller, projectId);

        let updatedTask = {
          task with
          title;
          description;
          dueDate;
          priority;
          projectId;
          updatedAt = Time.now();
        };

        tasks.add(id, updatedTask);
        updatedTask;
      };
      case (null) { Runtime.trap("Task not found") };
    };
  };

  public shared ({ caller }) func deleteTask(id : Nat) : async () {
    requireAuth(caller);

    switch (tasks.get(id)) {
      case (?task) {
        requireOwner(caller, task.owner);
        tasks.remove(id);
        let count = getUserTaskCount(caller);
        if (count > 0) {
          userTaskCounts.add(caller, count - 1);
        };
      };
      case (null) { Runtime.trap("Task not found") };
    };
  };

  public shared ({ caller }) func toggleTaskComplete(id : Nat) : async Task {
    requireAuth(caller);

    switch (tasks.get(id)) {
      case (?task) {
        requireOwner(caller, task.owner);

        let updatedTask = {
          task with
          completed = not task.completed;
          updatedAt = Time.now();
        };

        tasks.add(id, updatedTask);
        updatedTask;
      };
      case (null) { Runtime.trap("Task not found") };
    };
  };

  // Project CRUD Operations
  public shared ({ caller }) func createProject(name : Text) : async Project {
    requireAuth(caller);

    if (getUserProjectCount(caller) >= MAX_PROJECTS_PER_USER) {
      Runtime.trap("Maximum of 50 projects reached");
    };

    validateFieldLength(name, "Project name", 1, 100);

    let project : Project = {
      id = nextProjectId;
      name;
      owner = caller;
      createdAt = Time.now();
    };

    projects.add(nextProjectId, project);
    nextProjectId += 1;
    userProjectCounts.add(caller, getUserProjectCount(caller) + 1);
    project;
  };

  public shared ({ caller }) func renameProject(id : Nat, name : Text) : async Project {
    requireAuth(caller);
    validateFieldLength(name, "Project name", 1, 100);

    switch (projects.get(id)) {
      case (?project) {
        requireOwner(caller, project.owner);

        let updatedProject = { project with name };

        projects.add(id, updatedProject);
        updatedProject;
      };
      case (null) { Runtime.trap("Project not found") };
    };
  };

  public shared ({ caller }) func deleteProject(id : Nat) : async () {
    requireAuth(caller);

    switch (projects.get(id)) {
      case (?project) {
        requireOwner(caller, project.owner);

        // Unassign tasks from this project (filter by owner and projectId first)
        let tasksToUpdate = tasks.entries().toArray().filter(
          func((_, task)) {
            task.owner == caller and task.projectId == ?id
          }
        );
        let now = Time.now();
        for ((taskId, task) in tasksToUpdate.vals()) {
          tasks.add(taskId, { task with projectId = null; updatedAt = now });
        };

        projects.remove(id);
        let count = getUserProjectCount(caller);
        if (count > 0) {
          userProjectCounts.add(caller, count - 1);
        };
      };
      case (null) { Runtime.trap("Project not found") };
    };
  };

  public query ({ caller }) func getAllProjects() : async [Project] {
    requireAuth(caller);

    projects.values().toArray().filter(
      func(project) { project.owner == caller }
    );
  };

  // Query Operation
  public query ({ caller }) func getTasks(filter : TaskFilter, page : ?Nat, limit : ?Nat) : async PaginationResult<Task> {
    requireAuth(caller);

    let filtered = filterTasks(caller, filter);
    let sorted = sortTasks(filtered, filter.sortBy);
    let (validPage, validLimit) = validatePagination(page, limit);
    paginateArray<Task>(sorted, validPage, validLimit);
  };

  // Export Operation
  public query ({ caller }) func getTasksForExport(filter : TaskFilter) : async [TaskExport] {
    requireAuth(caller);

    let filtered = filterTasks(caller, filter);
    let sorted = sortTasks(filtered, filter.sortBy);

    sorted.map(
      func(task) {
        let projectName = switch (task.projectId) {
          case (?pid) {
            switch (projects.get(pid)) {
              case (?p) { ?p.name };
              case (null) { null };
            };
          };
          case (null) { null };
        };

        {
          id = task.id;
          title = task.title;
          description = task.description;
          dueDate = task.dueDate;
          priority = task.priority;
          projectName;
          completed = task.completed;
          createdAt = task.createdAt;
        };
      }
    );
  };

  // User Profile Operations
  public shared ({ caller }) func setDisplayName(displayName : Text) : async () {
    requireAuth(caller);
    validateFieldLength(displayName, "Display name", 1, 50);
    users.add(caller, { displayName });
  };

  public query ({ caller }) func getDisplayName() : async ?Text {
    requireAuth(caller);

    switch (users.get(caller)) {
      case (null) { null };
      case (?user) { ?user.displayName };
    };
  };
};
