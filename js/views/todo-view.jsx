/*global Backbone, jQuery, _, ENTER_KEY, ESC_KEY */
var app = app || {};

(function ($) {
  'use strict';

  // Todo Item View
  // --------------
  app.ItemComponent = React.createClass({
    // Toggle the `"completed"` state of the model.
    toggleCompleted: function () {
      this.props.todo.toggle();
    },
    
    getInitialState: function () {
      return {
        editing: false
      };
    },
    
    edit: function (e) {
        this.setState({
            editing: true
        });
    },

    componentDidUpdate: function (oldProps, oldState) {
        if (this.state.editing && !oldState.editing) {
            this.refs.editField.getDOMNode().focus();
        }
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
          <input className="toggle" type="checkbox" onChange={this.toggleCompleted} checked={this.props.todo.get("completed")} />    
          <label onDoubleClick={this.edit}>{todo.get("title")}</label>
          <button className="destroy"></button>
        </div>
        <input className="edit" ref="editField" onKeyDown={this.revertOnEscape} onBlur={this.close} onKeyPress={this.updateOnEnter} defaultValue={todo.get("title")} />
      </li>);
    }
  });  
  
 
})(jQuery);
