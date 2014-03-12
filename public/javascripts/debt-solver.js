$(function() {
  var Account = Backbone.Model.extend({
    defaults: function() {
      return {
        name: "Account Name",
        initialBalance: 100,
        apr: .1234,
        minimumPayment: 50,
        order: Accounts.nextOrder()
      };
    }
  });

  var AccountList = Backbone.Collection.extend({
    model: Account,
    localStorage: new Backbone.LocalStorage("debt-solver"),
    nextOrder: function() {
      if (!this.length) return 1;
      return this.last().get('order') + 1;
    },
    comparator: 'order'
  });

  var Accounts = new AccountList;

  var AccountView = Backbone.View.extend({
    tagName: "li",
    template: _.template($("#account-template").html()),
    events: {
      "dblclick .account": "edit",
      "click a.save": "save",
      "click a.cancel": "close",
      "click a.delete": "destroy"
    },
    initialize: function() {
      this.listenTo(this.model, "change", this.render);
      this.listenTo(this.model, "destroy", this.remove);

      this.$el.addClass("large-4");
      this.$el.addClass("column");
      this.$el.addClass("editing");
    },
    render: function() {
      var vars = this.model.toJSON();
      vars["id"] = Math.floor(Math.random()*10000);
      this.$el.html(this.template(vars));
      this.inputs = {
        name: this.$(".name"),
        initialBalance: this.$(".initialBalance"),
        apr: this.$(".apr"),
        minimumPayment: this.$(".minimumPayment")
      };

      return this;
    },
    edit: function() {
      this.$el.addClass("editing");
      this.inputs["name"].focus();
    },
    save: function() {
      var name = this.inputs["name"].val();
      var initialBalance = this.inputs["initialBalance"].val();
      var apr = this.inputs["apr"].val();
      var minimumPayment = this.inputs["minimumPayment"].val();

      this.model.save({
        name: name,
        initialBalance: initialBalance,
        apr: apr,
        minimumPayment: minimumPayment
      });

      this.close();
    },
    close: function() {
      this.$el.removeClass("editing");
    },
    destroy: function() {
      this.model.destroy();
    }
  });

  var AppView = Backbone.View.extend({
    el: $("#debt-solver-app"),
    events: {
      "click #create-account": "createAccount"
    },
    initialize: function() {
      this.listenTo(Accounts, "add", this.addAccount);
      this.listenTo(Accounts, "reset", this.addAllAccounts);
      this.listenTo(Accounts, "all", this.render);

      Accounts.fetch();
    },
    render: function() {
    },
    createAccount: function() {
      Accounts.create();
    },
    addAccount: function(account) {
      var view = new AccountView({
        model: account
      });
      this.$("#account-list").append(view.render().el);
    },
    addAllAccounts: function() {
      Accounts.each(this.addAccount, this);
    }
  });

  var App = new AppView;
});
