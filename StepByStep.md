## Add our additional script tags

At the top of the set of script tags that appear at the bottom of the body:

```html
    <script src="bower_components/react/react-with-addons.js"></script>
    <script src="bower_components/react/JSXTransformer.js"></script>
```

These add the main React library and the code that converts JSX files into pure JavaScript.

## Load the views as JSX

Rename `js/views/app-view.js` to `app-view.jsx` and `js/views/todo-view.js` to `todo-view.jsx`. In the `index.html` file, modify the script tags for everything starting with `todo-view.js` to be loaded by the JSX transformer:

```html
		<script type="text/jsx" src="js/views/todo-view.jsx"></script>
		<script type="text/jsx" src="js/views/app-view.jsx"></script>
		<script type="text/jsx" src="js/routers/router.js"></script>
		<script type="text/jsx" src="js/app.js"></script>
```

We do this to ensure that the loading order is what we need, even though the last two files there aren't JSX files.

## Turn the todoapp into a React component

Next, we'll turn the contents of the `todoapp` `<section>` of the HTML file into a React component. Cut that code (leaving the `<section>` empty in the HTML file) and add this to `app-view.jsx`:

```javascript
  var AppComponent = React.createClass({
    render: function () {
      return (<div>
        <header id="header">
          <h1>todos</h1>
          <input id="new-todo" placeholder="What needs to be done?" autofocus />
        </header>
        <section id="main">
          <input id="toggle-all" type="checkbox" />
          <label htmlFor="toggle-all">Mark all as complete</label>
          <ul id="todo-list"></ul>
        </section>
        <footer id="footer"></footer>
        </div>
      );
    }
  });
```

In the process here, we made a couple of changes:

1. We wrapped the contents in a `<div>`. React requires us to return a single component to render.
2. We closed the two `<input>` tags in the XML style with a trailing `/>`. JSX requires this.
3. We had to change the `for` attribute of the `<label>` tag to `htmlFor` because `for` is a JavaScript keyword. This is a slightly leaky abstraction, but it's not too big a deal. The `class` attribute is similarly listed as `className` in JSX.

Next, we need to tell React to render our new component by adding the following block just beneath our `appComponent`.

```javascript
  $(function () {
    React.renderComponent(<AppComponent/>, document.getElementById("todoapp"));
  });
```

When you reload the page, you'll see that it looks just as it did before.

## Aside: Mixing HTML and JS

When React was first introduced, the mixing of JavaScript and markup bothered many people. The message from the React team is this: your markup is already strongly coupled with the view code that manages it. You need look no farther than the `initialize` method of `AppView` to see that this is true.

```javascript
		initialize: function () {
			this.allCheckbox = this.$('#toggle-all')[0];
			this.$input = this.$('#new-todo');
			this.$footer = this.$('#footer');
			this.$main = this.$('#main');
			this.$list = $('#todo-list');
```

React's style reduces the number of places you need to look in order to figure out what's going on, and that's an important part of the reason React exists.

Keeping your view separate from the rest of your app makes sense, but keeping your view code separate from your template is not necessary.

## The StatsComponent

Copy the stats template from the HTML file into `app-view.jsx` as part of a new `StatsComponent` *above* the `AppComponent`:

```javascript
  var StatsComponent = React.createClass({
    render: function () {
      return (<div>
        <span id="todo-count"><strong><%= remaining %></strong> <%= remaining === 1 ? 'item' : 'items' %> left</span>
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
        <% if (completed) { %>
        <button id="clear-completed">Clear completed (<%= completed %>)</button>
        <% } %>
      </div>);
    }
  });
```

Note that we wrapped it in a `<div>` as we had for the main app view. We also changed the `<a>` tag's `class` attribute to `className` because that's what JSX expects in order to not conflict with JavaScript's `class` keyword.

Of course, what we're left with is not valid React JSX code because there's Underscore template cruft in there. If we have access to the todos, we'd be able to get all of the values we need in order to fill in the stats. Let's make it so that the todos will be passed in as a prop.

We can see the definitions of `completed` and `remaining` in `AppView.render`:

```javascript
			var completed = app.todos.completed().length;
			var remaining = app.todos.remaining().length;
```

Let's move that into `StatsComponent.render` and then use our new variables:

```javascript
    render: function () {
      var completed = this.props.todos.completed().length,
          remaining = this.props.todos.remaining().length,
          itemLabel = remaining === 1 ? 'item' : 'items';
      
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
          <% if (completed) { %>
          <button id="clear-completed">Clear completed (<%= completed %>)</button>
          <% } %>
        </div>);
    }
```

What about that button that is either going to be there or not depending on whether or not there are completed items? Except for the convenience `{}` for inserting variables, JSX doesn't have template language features. It's just JavaScript. So, let's just do a JavaScripty thing:

```javascript
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
```

React components can be assigned to variables. In this case, `clearButton` is either going to be `null` or a `<button>` component and then we incorporate that value into the returned output. When rendering the components, if React sees a `null`, it just drops it.

## Changing rendering to wire in the `StatsComponent`

Now, we want to wire in our `StatsComponent`. If you look in `AppView.render`, you'll see that the stats aren't displayed if there are no todos, so we'll do that as well. You can also see that `AppView.render` is managing the checkbox that reflects whether all of the todos are checked off. We'll move that logic into `AppComponent` as well.

In the code below, we set the `stats` and `allComplete` variables and then we refer to `stats` in the `<footer>` and `allComplete` on the `#toggle-all` element.

```javascript
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
```

Next, we're going to get rid of our code that runs on document ready that calls `React.render`. Add the `React.render` call at the top of `AppView.initialize` and `AppView.render`:

```javascript
      React.render(<AppComponent todos={app.todos} />, document.getElementById("todoapp"));
```

As you can see, we're now passing in `app.todos` as a `todos` prop for `AppComponent`. Also, the reason we need to add this to `initialize` is so that the DOM nodes are there when the rest of the `initialize` code runs.

One note about the state of things as we're moving through this refactoring: generally speaking, React should be in charge of everything under the DOM node into which you're rendering components. There is an escape hatch if you are including some old-style DOM code.

That said, these step-by-step changes still work because of React's DOM diffing code. React will warn you on the browser's console if there are elements that it doesn't recognize when it tries to apply changes, but all of the changes we've been making allow React to manage some nodes while Backbone/jQuery manage others.

Since we've started using `StatsComponent`, we can remove the rendering of that from `AppView.render` which gives us this:

```javascript
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
```

We can also remove the `statsTemplate` variable from `AppView` and remove the template block itself from `index.html`.

## Adding new todos

You might have noticed that the text input for new todos no longer was receiving the focus. React uses camelCase style for its component properties, so we need to change the `<input>` for new todos to have an `autoFocus` attribute (note the capital "F").

To add a todo, `AppView` handles keypress events in the `events` property of the view:

```javascript
		events: {
			'keypress #new-todo': 'createOnEnter',
			'click #clear-completed': 'clearCompleted',
			'click #toggle-all': 'toggleAllComplete'
		},
```

`createOnEnter` looks like this:

```javascript
		createOnEnter: function (e) {
			if (e.which === ENTER_KEY && this.$input.val().trim()) {
				app.todos.create(this.newAttributes());
				this.$input.val('');
			}
		},
```

`createOnEnter` relies on a method called `newAttributes` which looks like this:

```javascript
		newAttributes: function () {
			return {
				title: this.$input.val().trim(),
				order: app.todos.nextOrder(),
				completed: false
			};
		},
```

I would argue that this actually belongs on the model, but I'm focused on refactoring the view so we'll leave it in this file for now. It turns out that `newAttributes` is only called in `createOnEnter`, so we'll be able to just delete it and put the object it returns directly in our code that handles the keypress.

We'll change the `<input>` component in the `AppComponent.render` method to handle the keypress event and to give us access to the DOM node. Here's what it looks like:

```html
          <input id="new-todo" placeholder="What needs to be done?" autoFocus onKeyPress={this.handleKeyPress} ref="newTodo" />
```

Adding the keypress handler is simple: we just set an `onKeyPress` prop to `this.handleKeyPress`. React automatically binds React component methods, so passing in `this.handleKeyPress` will ensure that the method gets a proper `this` value when it's called.

The `ref` prop is special. It gives us access to the actual DOM node. Let's create the `AppComponent.handleKeyPress` method to see how it's used:

```javascript
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
```

Having set a ref called `newTodo`, we can get at the input DOM node itself by using `this.refs.newTodo.getDOMNode()`. Other than that, this code looks like pretty typical web event handling code.

With those changes to `AppComponent` in place, we can now delete:

1. `keypress #new-todo` from the `AppView.events` object
2. The line that sets `this.$input` in `AppView.initialize`
3. `AppView.newAttributes`
4. `AppView.createOnEnter`

You can reload the page and see that you can still create new todos.

## Creating an initial ItemComponent

Start by copying the item template into a new React component called `ItemComponent` in `todo-view.jsx`. We'll change the `class` attributes to `className` and fix up the `<input>` tags to be closed properly. We also wrap the whole template in `<li>` tags because that's what Backbone would do with the template contents.

After those quick, mechanical sorts of changes, we end up with this:

```javascript
  app.ItemComponent = React.createComponent({
    render: function () {
      return (<li>
        <div className="view">
          <input className="toggle" type="checkbox" <%= completed ? 'checked' : '' %> />
          <label><%- title %></label>
          <button className="destroy"></button>
        </div>
        <input className="edit" value="<%- title %>" />
      </li>);
    }
  });
```

Let's just assume that `todo` will be a prop for our new component:

```javascript
  app.ItemComponent = React.createClass({
    render: function () {
      var todo = this.props.todo;
      
      return (<li>
        <div className="view">
          <input className="toggle" type="checkbox" checked={todo.get("completed")} />
          <label>{todo.get("title")}</label>
          <button className="destroy"></button>
        </div>
        <input className="edit" defaultValue={todo.get("title")} />
      </li>);
    }
  });
```

One other subtle change in the code above: on the `<input>` we change the `value` attribute to `defaultValue`, because we want the field to be editable by the user. We re-render all of the components frequently with React, so this is a recognition that the value we're providing is the default value and not necessarily the current value.

React components are just normal JavaScript objects and can be passed around as such. By putting `ItemComponent` on `app`, we'll be able to access this component from `AppComponent`.

Using this turns out to be amazingly simple. Just a couple of changes to the `AppComponent.render` function. When declaring the variables at the top of that method:

```javascript
          todoItems = this.props.todos.map(function (todo) {
            return (<app.ItemComponent todo={todo} key={todo.get("order")} />);
          });
```

This uses the standard functional `map` idiom to create a list of `app.ItemComponent`s. As expected by the component, we pass in `title` and `completed` properties.

The `key` property is something React uses to manage the list items. It needs to be unique in the list. React will use that to add, move and delete the item from the DOM if it needs to.

Then, we have React put that list of items in the right place in the return value from `render`:

```html
          <ul id="todo-list">{todoItems}</ul>
```

Next, we need to disconnect `AppView`'s code which was managing that list:

1. Remove the `this.$list` setting that happens in `AppView.initialize`
2. Delete the body of `addOne`
3. Delete the body of `addAll`

When you reload the page, you'll see your list of todos. You should also see that you can add new todos, even though we just deleted the code responsible for displaying new todos!

This is the "React way" kicking in. We just generate the components that we want to appear on the screen and React handles the updates.

## Check the Dev Tools Console

If you haven't already had your browser's developer tools console open, now would be a good time to do so.

React provides *really awesome* error messages. Many times, if you don't use React in the "right" way, it will tell you in the console. For example, if we had forgotten the `key` prop when rendering `ItemComponent`s, React would have warned us about that. Right now, it's warning us about improperly configured read-only fields:

```
Warning: You provided a `checked` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultChecked`. Otherwise, set either `onChange` or `readOnly`. Check the render method of `AppComponent`.
```

React wants to be sure that we haven't forgotten to handle changes to our fields. Let's clean up the checkboxes. `ItemComponent` is rendering one of them. When it's clicked, it should toggle the todo's completion state. To do this, we move `toggleCompleted` from `TodoView` to `ItemComponent` and change it slightly to access the todo from `props`:

```javascript
    toggleCompleted: function () {
        this.props.todo.toggle();
    },
```

We also need to remove the reference to `toggleCompleted` from `TodoView`'s `events`. Finally, we wire up the event by adding `onChange` to the checkbox:

```javascript
          <input className="toggle" type="checkbox" onChange={this.toggleCompleted} checked={this.props.todo.get("completed")} />
```

Refresh your browser, and try toggling a todo. The checkmark properly reflects the completed state, but you may notice that the completed todos aren't getting checked off. We'll fix that in a minute.

In the console, you'll still see a complaint about `checked` props because of the "complete all" checkbox in the `AppComponent`. Let's fix that one in the same way.

We move `toggleAllComplete` into `AppComponent`. While it would still work if we refer to `app.todos`, it's much better to refer to `this.props.todos`, because that makes this a reusable component that is not dependent on a global variable. Having two of these todo lists on a single page would be easy. We'll also extract the `allComplete` definition from the `render` method into its own method:

```javascript
    allComplete: function () {
      return this.props.todos.remaining().length === 0;
    },
    
    toggleAllComplete: function () {
			var completed = !this.allComplete();

			this.props.todos.each(function (todo) {
				todo.save({
					completed: completed
				});
			});
		},
```

Note how the original `toggleAllComplete` referred to the state in a checkbox rather than going back to the model, which is the real source of truth.

We need to add the change handler to the render method:

```javascript
          <input id="toggle-all" type="checkbox" onChange={this.toggleAllComplete} checked={allComplete} />
```

Now, we need to remove the references to `toggleAllComplete` from `AppView`. Get rid of the line from `AppView.events` and also the line in `initialize` that saves a reference to the `allCheckbox` DOM node.

Reload in your browser. You should still be able to toggle all, *and* the "checked" warnings in the console should be gone.

## Add the proper class for completed items

When an item is completed, it's supposed to get a "completed" class applied to it, but we haven't done that so the items don't get pleasantly crossed off on our list. The React addons include a very pleasant way to handle this: the `classSet`. Here's how we use it in `ItemComponent.render`:

```javascript
    render: function () {
      var todo = this.props.todo,
        itemClasses = React.addons.classSet({
            completed: todo.get("completed")
        });
      return (<li className={itemClasses}>
```

`classSet` creates a string in which all of the keys of the passed in object which have `true` values will be present. So, `itemClasses` will either be an empty string or contain `completed`. Refresh with this and you'll see that completed items now appear crossed out.

## Allow editing

To edit, we're introducing a bit of "view state". It's not really a part of our model because a todo doesn't itself have the notion of being edited. React provides the concept of "state" as independent from "props" for storing just this kind of information. Let's set some initial state on `ItemComponent` so that  editing mode starts in the "off" state:

```javascript
    getInitialState: function () {
      return {
        editing: false
      };
    },    
```

Next, we'll make an `edit` method that sets this to `true`:

```javascript
    edit: function (e) {
        this.setState({
            editing: true
        });
    },
```

Whenever you use `this.setState` in a React component, React will rerender the component automatically. We need to add the editing class when `editing` is true:

```javascript
    render: function () {
        var todo = this.props.todo,
            itemClasses = React.addons.classSet({
                completed: todo.get("completed"),
                editing: this.state.editing
            });
```

Finally, we call our `edit` method when the `<label>` is double clicked:

```javascript
                <label onDoubleClick={this.edit}>{todo.get("title")}</label>
```

Reload, and by double clicking you'll see that we can switch to editing mode now.

## Focusing the edit field

One irritating difference between this todo component and the original one is that double clicking the label doesn't focus the input field. This is one of those times when we need to interact with the DOM directly, because only when the `editing` state changes do we want to focus the node. React has a simple solution for this as part of its component life cycle: the `componentDidUpdate` method. Here's what we write:

```javascript
    componentDidUpdate: function (oldProps, oldState) {
        if (this.state.editing && !oldState.editing) {
            this.refs.editField.getDOMNode().focus();
        }
    },
```

The code is pretty clear: we get the previous versions of props and state, so we can see when we transition from not editing to editing. Then, we can get the actual DOM node and call `focus` on it. We need to add the ref when we render the component, like so:

```javascript
            <input className="edit" ref="editField" defaultValue={todo.get("title")} />
```

Reload with those code changes, and now you have an automatically focused input field.

## Handle enter and escape

Let's copy `close`, `updateOnEnter`, `revertOnEscape` and `clear` from `TodoView` and paste them into `ItemComponent`. The `close` method contains this comment:

```javascript
			// We don't want to handle blur events from an item that is no
			// longer being edited. Relying on the CSS class here has the
			// benefit of us not having to maintain state in the DOM and the
			// JavaScript logic.
			if (!this.$el.hasClass('editing')) {
```

Funnily enough, React gives us the exact opposite situation. React lets us maintain the state in JavaScript and not have to think about the DOM.

For `close`, we need to get the value using our `ref`, we check editing via `this.state` and we break out of editing mode via `this.setState`, not by manipulating classes in the DOM:

```javascript
    close: function () {
      var value = this.refs.editField.getDOMNode().value;
      var trimmedValue = value.trim();

      if (!this.state.editing) {
        return;
      }

      if (trimmedValue) {
        this.props.todo.save({ title: trimmedValue });

        if (value !== trimmedValue) {
          // Model values changes consisting of whitespaces only are
          // not causing change to be triggered Therefore we've to
          // compare untrimmed version with a trimmed one to check
          // whether anything changed
          // And if yes, we've to trigger change event ourselves
          this.props.todo.trigger('change');
        }
      } else {
        this.clear();
      }

      this.setState({
        editing: false
      });
    },
```

`updateOnEnter` is unchanged, clear needs to refer to `this.props.todo`:

```javascript
    clear: function () {
      this.props.todo.destroy();
    },
```

`revertOnEscape` needs changes similar to those in `close`:

```javascript
    revertOnEscape: function (e) {
      if (e.which === ESC_KEY) {
        this.setState({
          editing: false
        });

        // Also reset the hidden input back to the original value.
        this.refs.editField.getDOMNode().value = this.props.todo.get("title");
      }
    },
```

Finally, we wire up blur, keypress and keydown events on the input field:

```javascript
            <input className="edit" ref="editField" onKeyDown={this.revertOnEscape} onBlur={this.close} onKeyPress={this.updateOnEnter} defaultValue={todo.get("title")} />
```

## Filtering the todos

At this point, we've converted over everything in `TodoView`, *except* for hiding completed todos. While we *could* have items manage their own visibility as `TodoView` does, it seems cleaner for the `AppComponent` to simply choose not to render hidden todos. It's also really easy. `TodoView.isHidden` looks like this:

```javascript
		isHidden: function () {
			return this.model.get('completed') ?
				app.TodoFilter === 'active' :
				app.TodoFilter === 'completed';
		},
```

We just need to turn the logic around to tell us whether a given todo is visible and then we can use that logic in a filter function back in `AppComponent.render`:

```javascript
          todoItems = this.props.todos.filter(function (todo) {
            return todo.get("completed") ? app.TodoFilter !== "active" : app.TodoFilter !== "completed";
          }).map(function (todo) {
            return (<app.ItemComponent todo={todo} key={todo.get("order")} />);
          });
```

This is standard functional programming style. We filter the todos and then map the filtered todos to render the components.

Reload and you'll see that it really was that easy.

## Selecting the proper filter visually

There's code in `AppView.render` to visually select the current filter. We should replace this with React style in `StatsComponent`:

```javascript
          allFilterClass = app.TodoFilter === "" ? "selected" : "",
          activeFilterClass = app.TodoFilter === "active" ? "selected" : "",
          completedFilterClass = app.TodoFilter === "completed" ? "selected" : "";
```

We could have used React.addons.classSet there, but it was just a single class, so it seemed simple enough to do it this way.

The markup for `StatsComponent` now looks like this:

```javascript
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
```

## Only rendering main as needed

`AppView.render` includes this little bit:

```javascript
			if (app.todos.length) {
				this.$main.show();
			} else {
				this.$main.hide();
			}
```

While we *could* show and hide the nodes, with React it's easy enough to just render or not. To do this, we pull the main section up into a variable in `AppComponent.render` and then refer to that variable in our markup:

```javascript
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
```

If you try this out, you'll see that the main section goes away entirely when there are no todos.

## Clear completed todos

There is just one last piece of functionality lurking in the old Backbone views: the clear completed todos button. Move `AppView.clearCompleted` into the `StatsComponent` and change it to reference `this.props.todos`:

```javascript
      clearCompleted: function () {
        _.invoke(this.props.todos.completed(), 'destroy');
        return false;
      },
```

Then, we add an `onClick` to the `clearButton`:

```javascript
          clearButton = !completed ? null : (<button onClick={this.clearCompleted} id="clear-completed">Clear completed ({completed})</button>),
```

Make sure to remove the event from `AppView.events`. Reload, and that feature should work.

## Final cleanup

We can delete `TodoView` entirely and clear out almost all of `AppView`. One minor change to make is in `initialize`, we need to point the "change\:completed" and "filter" events at `this.render`. With React, any change basically means "rerender".

I also removed `jQuery` from the top and bottom of the file.

Here's the final app-view.jsx:

```javascript
/*global React, Backbone, jQuery, _, ENTER_KEY, document */
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
        var completed = !this.allComplete();

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
```

and todo-view.jsx:

```javascript
/*global React, Backbone, jQuery, _, ENTER_KEY, ESC_KEY */
var app = app || {};

(function () {
	'use strict';

	// Todo Item View
	// --------------
  
  app.ItemComponent = React.createClass({
  
    getInitialState: function () {
        return {
            editing: false
        };
    },
    
    toggleCompleted: function () {
        this.props.todo.toggle();
    },
    
    componentDidUpdate: function (oldProps, oldState) {
        if (this.state.editing && !oldState.editing) {
            this.refs.editField.getDOMNode().focus();
        }
    },
    
    edit: function (e) {
        this.setState({
            editing: true
        });
    },

    close: function () {
        var value = this.refs.editField.getDOMNode().value;
			  var trimmedValue = value.trim();

		 	  if (!this.state.editing) {
            return;
			  }

			  if (trimmedValue) {
				    this.props.todo.save({ title: trimmedValue });

            if (value !== trimmedValue) {
                // Model values changes consisting of whitespaces only are
                // not causing change to be triggered Therefore we've to
                // compare untrimmed version with a trimmed one to check
                // whether anything changed
                // And if yes, we've to trigger change event ourselves
                this.props.todo.trigger('change');
            }
			  } else {
            this.clear();
			  }

			  this.setState({
            editing: false
        });
		},

		// If you hit `enter`, we're through editing the item.
		updateOnEnter: function (e) {
        if (e.which === ENTER_KEY) {
            this.close();
        }
		},
    
    clear: function () {
			  this.props.todo.destroy();
		},
    
    revertOnEscape: function (e) {
        if (e.which === ESC_KEY) {
            this.setState({
                editing: false
            });
            // Also reset the hidden input back to the original value.
            this.refs.editField.getDOMNode().value = this.props.todo.get('title');
        }
		},


    render: function () {
        var todo = this.props.todo,
            itemClasses = React.addons.classSet({
                completed: todo.get("completed"),
                editing: this.state.editing
            });
            
        return (<li className={itemClasses}>
            <div className="view">
                <input className="toggle" type="checkbox" onChange={this.toggleCompleted} checked={todo.get("completed")} />
                <label onDoubleClick={this.edit}>{todo.get("title")}</label>
                <button className="destroy" onClick={this.clear}></button>
            </div>
            <input className="edit" ref="editField" onKeyDown={this.revertOnEscape} onBlur={this.close} onKeyPress={this.updateOnEnter} defaultValue={todo.get("title")} />
        </li>);
    }
  });

})();
```

# Observations

* The big win is the functional style. A given state of data will automatically result in a matching UI.
* The markup and JavaScript that operate on it are fundamentally coupled. Putting them together makes things clearer.
* The Backbone style stored view state in the DOM and the model in JS. The React version stores both in JS.
* The DOM is slow and not having to look up view state there is likely a win.
* When we did need to use the DOM, React provided very straightforward ways to do so.
* No jQuery required. Events are normalized and handled efficiently.