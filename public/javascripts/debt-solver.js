$(function() {
  var Account = Backbone.Model.extend({
    defaults: function() {
      return {
        name: "Account Name",
        initialBalance: 100,
        apr: .1234,
        minimumPayment: 50,
        isNew: true,
        order: Accounts.nextOrder()
      };
    },
    solveForTime: function(monthlyPayment) {
      if (!monthlyPayment) {
        monthlyPayment = this.get("minimumPayment");
      }
      return Math.log((-monthlyPayment/(this.get("apr")/12))/(this.get("initialBalance")-monthlyPayment/(this.get("apr")/12)))/Math.log(1+(this.get("apr")/12));
    },
    solveForPayment: function(months) {
      return Math.abs(((this.get("apr")/12)*(-this.get("initialBalance")*Math.pow((1+(this.get("apr")/12), months))))/(Math.pow((1+(this.get("apr")/12)), months)-1));
    },
    calculateFutureValue: function(months) {
      return this.get("initialBalance")*Math.pow((1+(this.get("apr")/12)), months);
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
      "click a.edit-button": "edit",
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
      this.$(".view").addClass("hide");
      this.$(".edit").removeClass("hide");
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
        minimumPayment: minimumPayment,
        isNew: false
      });

      this.close();
    },
    close: function() {
      this.$(".edit").addClass("hide");
      this.$(".view").removeClass("hide");
    },
    destroy: function() {
      this.model.destroy();
    }
  });

  var AppView = Backbone.View.extend({
    el: $("#debt-solver-app"),
    events: {
      "click #create-account": "createAccount",
      "click #accounts-done": "runBasicCalculations"
    },
    initialize: function() {
      this.listenTo(Accounts, "add", this.addAccount);
      this.listenTo(Accounts, "reset", this.addAllAccounts);
      this.listenTo(Accounts, "all", this.render);
      this.listenTo(Accounts, "add", this.showDoneButton);
      this.listenTo(Accounts, "remove", this.hideDoneButton);

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
    },
    showDoneButton: function() {
      if (Accounts.length > 0) {
        if ($("#accounts-done").hasClass("hidden")) {
          $("#accounts-done").removeClass("hidden");
        }
      }
    },
    hideDoneButton: function() {
      if (Accounts.length == 0) {
        if (!$("#accounts-done").hasClass("hidden")) {
          $("#accounts-done").addClass("hidden");
        }
      }
    },
    runBasicCalculations: function() {
      $("#basics").removeClass("hide");
      var basicsTemplate = _.template($("#account-basics-template").html());
      Accounts.each(function(model, index) {
        var vars = model.toJSON();
        vars["months"] = model.solveForTime().toFixed(2);
        vars["futureValue"] = model.calculateFutureValue(vars["months"]).toFixed(2);
        vars["interest"] = (vars["futureValue"] - vars["initialBalance"]).toFixed(2);
        $("#basics-list").append(basicsTemplate(vars));
      });
    }
  });

  var App = new AppView;
});
