/*global Backbone, jQuery, _, ENTER_KEY */
var app = app || {};

(function () {
  'use strict';

  var StatsComponent = React.createClass({
    clearCompleted: function () {
      _.invoke(this.props.todos.completed(), 'destroy');
      return false;
    },
    
    render: function () {
      var completed = this.props.todos.completed().length,
          remaining = this.props.todos.remaining().length,
          itemLabel = remaining === 1 ? 'item' : 'items',
          clearButton = !completed ? null : (<button onClick={this.clearCompleted} id="clear-completed">Clear completed ({completed})</button>),
          allFilterClass = app.TodoFilter === "" ? "selected" : "",
          activeFilterClass = app.TodoFilter === "active" ? "selected" : "",
          completedFilterClass = app.TodoFilter === "completed" ? "selected" : "";

      return (<div>
          <span id="todo-count"><strong>{remaining}</strong> {itemLabel} left</span>
          <ul id="filters">
            <li>
            <a className={allFilterClass} href="#/">All</a>
            </li>
            <li>
              <a className={activeFilterClass} href="#/active">Active</a>
            </li>
            <li>
              <a className={completedFilterClass} href="#/completed">Completed</a>
            </li>
          </ul>
          {clearButton}
        </div>);
    }    
    
  });  
  
  var AppComponent = React.createClass({
    handleKeyPress: function (e) {
      var input = this.refs.newTodo.getDOMNode(),
          text = input.value.trim();

      if (e.which === ENTER_KEY && text) {
        this.props.todos.create({
          title: text,
          order: this.props.todos.nextOrder(),
          completed: false
        });
        input.value = "";
      }
    },
    
    allComplete: function () {
        return this.props.todos.remaining().length === 0;
    },    

    toggleAllComplete: function () {
      var completed = this.allCheckbox.checked;

      this.props.todos.each(function (todo) {
        todo.save({
          completed: completed
        });
      });
    },    
    
    render: function () {
      var stats = !this.props.todos.length ? null : (<StatsComponent todos={this.props.todos} />),
          allComplete = this.allComplete(),
          todoItems = this.props.todos.filter(function (todo) {
            return todo.get("completed") ? app.TodoFilter !== "active" : app.TodoFilter !== "completed";
          }).map(function (todo) {
            return (<app.ItemComponent todo={todo} key={todo.get("order")} />);
          });

      var main = null;
      if (this.props.todos.length) {
        main = (<section id="main">
          <input id="toggle-all" type="checkbox" onChange={this.toggleAllComplete} checked={allComplete} />
          <label htmlFor="toggle-all">Mark all as complete</label>
          <ul id="todo-list">{todoItems}</ul>
        </section>);
      }
      
      return (<div>
        <header id="header">
          <h1>todos</h1>
          <input id="new-todo" placeholder="What needs to be done?" autoFocus onKeyPress={this.handleKeyPress} ref="newTodo" />
        </header>
        {main}
        <footer id="footer">{stats}</footer>
        </div>
      );
    }
  });
    
  // The Application
  // ---------------

  // Our overall **AppView** is the top-level piece of UI.
  app.AppView = Backbone.View.extend({  
    initialize: function () {
      React.render(<AppComponent todos={app.todos} />, document.getElementById("todoapp"));      
      this.listenTo(app.todos, 'change:completed', this.render);
      this.listenTo(app.todos, 'filter', this.render);
      this.listenTo(app.todos, 'all', this.render);

      // Suppresses 'add' events with {reset: true} and prevents the app view
      // from being re-rendered for every model. Only renders when the 'reset'
      // event is triggered at the end of the fetch.
      app.todos.fetch({reset: true});
    },

    // Re-rendering the App just means refreshing the statistics -- the rest
    // of the app doesn't change.
    render: function () {
        React.render(<AppComponent todos={app.todos} />, document.getElementById("todoapp"));
    }
  });    

})();
