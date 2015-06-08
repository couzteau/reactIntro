/*global Backbone, jQuery, _, ENTER_KEY */
var app = app || {};

(function ($) {
  'use strict';

  // The Application
  // ---------------

  // Our overall **AppView** is the top-level piece of UI.
  app.AppView = Backbone.View.extend({

    // Instead of generating a new element, bind to the existing skeleton of
    // the App already present in the HTML.
    el: '#todoapp',

    // Our template for the line of statistics at the bottom of the app.
    statsTemplate: _.template($('#stats-template').html()),

    // Delegated events for creating new items, and clearing completed ones.
    events: {
      'keypress #new-todo': 'createOnEnter',
      'click #clear-completed': 'clearCompleted',
      'click #toggle-all': 'toggleAllComplete'
    },

    // At initialization we bind to the relevant events on the `Todos`
    // collection, when items are added or changed. Kick things off by
    // loading any preexisting todos that might be saved in *localStorage*.
    initialize: function () {
      React.render(<AppComponent todos={app.todos} />, document.getElementById("todoapp"));      
      
      this.allCheckbox = this.$('#toggle-all')[0];
      this.$input = this.$('#new-todo');
      this.$footer = this.$('#footer');
      this.$main = this.$('#main');
      this.$list = $('#todo-list');

      this.listenTo(app.todos, 'add', this.addOne);
      this.listenTo(app.todos, 'reset', this.addAll);
      this.listenTo(app.todos, 'change:completed', this.filterOne);
      this.listenTo(app.todos, 'filter', this.filterAll);
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

        if (app.todos.length) {
            this.$main.show();

            this.$('#filters li a')
                .removeClass('selected')
                .filter('[href="#/' + (app.TodoFilter || '') + '"]')
                .addClass('selected');
        } else {
            this.$main.hide();
        }
    },

    // Add a single todo item to the list by creating a view for it, and
    // appending its element to the `<ul>`.
    addOne: function (todo) {
      var view = new app.TodoView({ model: todo });
      this.$list.append(view.render().el);
    },

    // Add all items in the **Todos** collection at once.
    addAll: function () {
      this.$list.html('');
      app.todos.each(this.addOne, this);
    },

    filterOne: function (todo) {
      todo.trigger('visible');
    },

    filterAll: function () {
      app.todos.each(this.filterOne, this);
    },

    // Generate the attributes for a new Todo item.
    newAttributes: function () {
      return {
        title: this.$input.val().trim(),
        order: app.todos.nextOrder(),
        completed: false
      };
    },

    // If you hit return in the main input field, create new **Todo** model,
    // persisting it to *localStorage*.
    createOnEnter: function (e) {
      if (e.which === ENTER_KEY && this.$input.val().trim()) {
        app.todos.create(this.newAttributes());
        this.$input.val('');
      }
    },

    // Clear all completed todo items, destroying their models.
    clearCompleted: function () {
      _.invoke(app.todos.completed(), 'destroy');
      return false;
    },

    toggleAllComplete: function () {
      var completed = this.allCheckbox.checked;

      app.todos.each(function (todo) {
        todo.save({
          completed: completed
        });
      });
    }
  });

  var StatsComponent = React.createClass({
    render: function () {
      var completed = this.props.todos.completed().length,
          remaining = this.props.todos.remaining().length,
          itemLabel = remaining === 1 ? 'item' : 'items',
          clearButton = !completed ? null : (<button id="clear-completed">Clear completed ({completed})</button>);

      return (<div>
          <span id="todo-count"><strong>{remaining}</strong> {itemLabel} left</span>
          <ul id="filters">
            <li>
            <a className="selected" href="#/">All</a>
            </li>
            <li>
              <a href="#/active">Active</a>
            </li>
            <li>
              <a href="#/completed">Completed</a>
            </li>
          </ul>
          {clearButton}
        </div>);
    }    
    
  });  
  
  var AppComponent = React.createClass({
    render: function () {
      var stats = !this.props.todos.length ? null : (<StatsComponent todos={this.props.todos} />),
          allComplete = this.props.todos.remaining().length === 0;

      return (<div>
        <header id="header">
          <h1>todos</h1>
          <input id="new-todo" placeholder="What needs to be done?" autofocus />
        </header>
        <section id="main">
          <input id="toggle-all" type="checkbox" checked={allComplete} />
          <label htmlFor="toggle-all">Mark all as complete</label>
          <ul id="todo-list"></ul>
        </section>
        <footer id="footer">{stats}</footer>
        </div>
      );
    }
  });
                        
  
})(jQuery);
