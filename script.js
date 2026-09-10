const STORAGE_KEY = "beautiful-todo-items";

let todos = loadTodos();
let currentFilter = "all";

const todoForm = document.querySelector("#todo-form");
const todoInput = document.querySelector("#todo-input");
const todoList = document.querySelector("#todo-list");
const emptyMessage = document.querySelector("#empty-message");
const taskCount = document.querySelector("#task-count");
const filters = document.querySelector("#filters");
const clearCompletedButton = document.querySelector("#clear-completed");

// Loads saved tasks from localStorage and returns an empty list when no valid data exists.
function loadTodos() {
  const savedTodos = localStorage.getItem(STORAGE_KEY);

  if (!savedTodos) {
    return [];
  }

  try {
    const parsedTodos = JSON.parse(savedTodos);
    return Array.isArray(parsedTodos) ? parsedTodos : [];
  } catch (error) {
    console.error("Could not load saved tasks.", error);
    return [];
  }
}

// Saves the current task list to localStorage.
function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

// Creates a task object with a unique identifier and the supplied title.
function createTodo(title) {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title,
    completed: false
  };
}

// Returns tasks matching the currently selected filter.
function getVisibleTodos() {
  if (currentFilter === "active") {
    return todos.filter((todo) => !todo.completed);
  }

  if (currentFilter === "completed") {
    return todos.filter((todo) => todo.completed);
  }

  return todos;
}

// Renders task rows, filter state, the count, and the empty-list message.
function render() {
  const visibleTodos = getVisibleTodos();
  todoList.replaceChildren();

  visibleTodos.forEach((todo) => {
    todoList.appendChild(createTodoElement(todo));
  });

  const activeCount = todos.filter((todo) => !todo.completed).length;
  taskCount.textContent = `${activeCount} task${activeCount === 1 ? "" : "s"} left`;
  emptyMessage.hidden = visibleTodos.length !== 0;
  clearCompletedButton.disabled = !todos.some((todo) => todo.completed);

  filters.querySelectorAll(".filter-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === currentFilter);
  });
}

// Builds an accessible DOM row for one task and wires its controls.
function createTodoElement(todo) {
  const item = document.createElement("li");
  item.className = `todo-item${todo.completed ? " completed" : ""}`;
  item.dataset.id = todo.id;

  const checkbox = document.createElement("input");
  checkbox.className = "todo-checkbox";
  checkbox.type = "checkbox";
  checkbox.checked = todo.completed;
  checkbox.setAttribute("aria-label", `Mark ${todo.title} complete`);
  checkbox.addEventListener("change", () => toggleTodo(todo.id));

  const title = document.createElement("span");
  title.className = "todo-title";
  title.textContent = todo.title;

  const editButton = document.createElement("button");
  editButton.className = "item-button";
  editButton.type = "button";
  editButton.textContent = "EDIT";
  editButton.addEventListener("click", () => startEditing(item, todo));

  const deleteButton = document.createElement("button");
  deleteButton.className = "item-button delete-button";
  deleteButton.type = "button";
  deleteButton.textContent = "DELETE";
  deleteButton.addEventListener("click", () => deleteTodo(todo.id));

  item.append(checkbox, title, editButton, deleteButton);
  return item;
}

// Adds a new task from the form input and redraws the list.
function addTodo(event) {
  event.preventDefault();
  const title = todoInput.value.trim();

  if (!title) {
    return;
  }

  todos.unshift(createTodo(title));
  saveTodos();
  todoInput.value = "";
  todoInput.focus();
  render();
}

// Toggles completion for the task with the given identifier.
function toggleTodo(id) {
  todos = todos.map((todo) => todo.id === id ? { ...todo, completed: !todo.completed } : todo);
  saveTodos();
  render();
}

// Deletes the task with the given identifier.
function deleteTodo(id) {
  todos = todos.filter((todo) => todo.id !== id);
  saveTodos();
  render();
}

// Replaces a task row with an inline editor and saves valid submitted text.
function startEditing(item, todo) {
  const editInput = document.createElement("input");
  editInput.className = "edit-input";
  editInput.type = "text";
  editInput.maxLength = 200;
  editInput.value = todo.title;
  editInput.setAttribute("aria-label", "Edit task");

  const saveButton = document.createElement("button");
  saveButton.className = "item-button";
  saveButton.type = "button";
  saveButton.textContent = "SAVE";

  const cancelButton = document.createElement("button");
  cancelButton.className = "item-button";
  cancelButton.type = "button";
  cancelButton.textContent = "CANCEL";

  const finishEditing = (shouldSave) => {
    const title = editInput.value.trim();
    if (shouldSave && title) {
      todos = todos.map((entry) => entry.id === todo.id ? { ...entry, title } : entry);
      saveTodos();
    }
    render();
  };

  saveButton.addEventListener("click", () => finishEditing(true));
  cancelButton.addEventListener("click", () => finishEditing(false));
  editInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") finishEditing(true);
    if (event.key === "Escape") finishEditing(false);
  });

  item.replaceChildren(editInput, saveButton, cancelButton);
  editInput.focus();
  editInput.select();
}

// Changes the active filter and redraws the visible tasks.
function changeFilter(event) {
  const button = event.target.closest(".filter-button");
  if (!button) {
    return;
  }

  currentFilter = button.dataset.filter;
  render();
}

// Removes every completed task from the list.
function clearCompleted() {
  todos = todos.filter((todo) => !todo.completed);
  saveTodos();
  render();
}

todoForm.addEventListener("submit", addTodo);
filters.addEventListener("click", changeFilter);
clearCompletedButton.addEventListener("click", clearCompleted);
render();
