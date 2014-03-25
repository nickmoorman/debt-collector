$(function() {
  var Account = Backbone.Model.extend({
    defaults: function() {
      return {
        name: "Account Name",
        initialBalance: 100,
        apr: .1234,
        minimumPayment: 50,
        isNewObject: true,
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
    },
    calculateBalance: function(months) {
      if (months == 0) {
        return parseFloat(this.get("initialBalance"));
      } else {
        // TODO: Verify this formula
        return this.calculateBalance(months-1)*(1+(this.get("apr")/12)) - this.get("minimumPayment");
      }
    }
  });
  var Loan = Account.extend({
  });

  var AccountList = Backbone.Collection.extend({
    model: Account,
    localStorage: new Backbone.LocalStorage("debt-collector-account"),
    nextOrder: function() {
      if (!this.length) return 1;
      return this.last().get('order') + 1;
    },
    comparator: 'order'
  });
  var LoanList = AccountList.extend({
    model: Loan,
    localStorage: new Backbone.LocalStorage("debt-collector-loan")
  });

  var Accounts = new AccountList;
  var Loans = new LoanList;

  // Extend Underscore's template() to allow recursive template inclusions
  // From https://gist.github.com/unicodefreak/1901458
  // (with modifications from http://emptysqua.re/blog/adding-an-include-tag-to-underscore-js-templates/#comment-1237991965)
  // which is based on http://emptysqua.re/blog/adding-an-include-tag-to-underscore-js-templates/
  var _underscore_template = _.template;
  _.template = function(str, data) {
    // match "<% include template-id %>"
    while (str != (str = str.replace(
      /<%\sinclude\s*(.*?)\s%>/g,
      function(match, templateId) {
        var el = $('#' + templateId);
        return el ? el.html() : '';
      }
    )));

    return _underscore_template(str, data);
  };

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
      if (!(this.model instanceof Account)) {
        this.model = new Account;
      }
      this.listenTo(this.model, "change", this.render);
      this.listenTo(this.model, "destroy", this.remove);
    },
    render: function() {
      var data = this.model.toJSON();
      data["id"] = Math.floor(Math.random()*10000);
      data["months"] = this.model.solveForTime().toFixed(2);
      data["futureValue"] = this.model.calculateFutureValue(data["months"]).toFixed(2);
      data["interest"] = (data["futureValue"] - data["initialBalance"]).toFixed(2);
      this.$el.html(this.template(data));

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

      this.model.set({
        name: name,
        initialBalance: initialBalance,
        apr: apr,
        minimumPayment: minimumPayment,
        isNewObject: false
      });
      this.model.save();

      this.close();
    },
    close: function() {
      if (this.model.get("isNewObject")) {
        this.destroy();
        this.remove();
      } else {
        this.$(".edit").addClass("hide");
        this.$(".view").removeClass("hide");
      }
    },
    destroy: function() {
      this.model.destroy();
    }
  });
  var LoanView = AccountView.extend({
    template: _.template($("#loan-template").html()),
    initialize: function() {
      if (!(this.model instanceof Loan)) {
        this.model = new Loan;
      }
      this.listenTo(this.model, "change", this.render);
      this.listenTo(this.model, "destroy", this.remove);
    }
  });

  var AppView = Backbone.View.extend({
    el: $("#debt-collector-app"),
    events: {
      "click #add-account": "createAccount",
      "click #add-loan": "createLoan"
    },
    initialize: function() {
      this.listenTo(Accounts, "add", this.addAccount);
      this.listenTo(Accounts, "reset", this.addAllAccounts);
      this.listenTo(Accounts, "all", this.render);
      this.listenTo(Accounts, "sync", this.showAccountsSummary);
      this.listenTo(Loans, "add", this.addLoan);
      this.listenTo(Loans, "reset", this.addAllLoans);
      this.listenTo(Loans, "all", this.render);

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
      this.showAccountsSummary();
    },
    showAccountsSummary: function() {
      var detailsTemplate = _.template($("#loan-details-template").html());

      var allAccounts = {
        name: "All Accounts",
        minimumPayment: 0,
        months: 0,
        futureValue: 0,
        interest: 0
      };
      var labels = [],
          totalData = [],
          balanceData = [],
          interestData = [];
      Accounts.each(function(model, index) {
        var vars = model.toJSON();
        vars["months"] = model.solveForTime().toFixed(2);
        vars["futureValue"] = model.calculateFutureValue(vars["months"]).toFixed(2);
        vars["interest"] = (vars["futureValue"] - vars["initialBalance"]).toFixed(2);

        // TODO: Find a better way to do this...
        allAccounts["minimumPayment"] = parseFloat(allAccounts["minimumPayment"]) + parseFloat(vars["minimumPayment"]);
        allAccounts["months"] = Math.max(allAccounts["months"], vars["months"]);
        allAccounts["futureValue"] = parseFloat(allAccounts["futureValue"]) + parseFloat(vars["futureValue"]);
        allAccounts["interest"] = parseFloat(allAccounts["interest"]) + parseFloat(vars["interest"]);

        // Calculate graph data
        for (var i = 0; i <= Math.ceil(model.solveForTime().toFixed(2)); i++) {
          var futureValue = model.calculateFutureValue(i).toFixed(2),
              balance = model.calculateBalance(i).toFixed(2),
              interest = futureValue - vars["initialBalance"];
          if (labels.length < i+1) {
            labels.push(i);
            totalData.push(futureValue);
            balanceData.push(balance);
            interestData.push(interest);
          } else {
            totalData[i] = totalData[i] + futureValue;
            balanceData[i] = balanceData[i] + balance;
            interestData[i] = interestData[i] + interest;
          }
        };
      });
      allAccounts["minimumPayment"] = allAccounts["minimumPayment"].toFixed(2);
      allAccounts["futureValue"] = allAccounts["futureValue"].toFixed(2);
      allAccounts["interest"] = allAccounts["interest"].toFixed(2);

      $("#account-summary").html(detailsTemplate(allAccounts));

      // This takes the first account and displays the balance and accrued interest over the duration of
      // payoff on a line graph
      // var labels = [],
      //     totalData = [],
      //     balanceData = [],
      //     interestData = [],
      //     account = Accounts.at(0);
      // for (var i = 0; i < Math.ceil(account.solveForTime().toFixed(2)); i++) {
      //   labels.push(i);
      //   totalData.push(account.calculateFutureValue(i).toFixed(2));
      //   balanceData.push(account.calculateBalance(i).toFixed(2));
      //   interestData.push(totalData[i] - account.get("initialBalance"));
      // };
      var data = {
        labels : labels,
        datasets : [
          /*{
            fillColor : "rgba(220,220,220,0.5)",
            strokeColor : "rgba(220,220,220,1)",
            pointColor : "rgba(220,220,220,1)",
            pointStrokeColor : "#fff",
            data : totalData
          },*/
          {
            fillColor : "rgba(151,187,205,0.5)",
            strokeColor : "rgba(151,187,205,1)",
            pointColor : "rgba(151,187,205,1)",
            pointStrokeColor : "#fff",
            data : balanceData
          },
          {
            fillColor : "rgba(220,50,50,0.5)",
            strokeColor : "rgba(220,50,50,1)",
            pointColor : "rgba(220,50,50,1)",
            pointStrokeColor : "#fff",
            data : interestData
          }
        ]
      };
      var ctx = $("#summary-chart").get(0).getContext("2d");
      var summaryChart = new Chart(ctx).Line(data);

      Loans.fetch();
    },
    createLoan: function() {
      Loans.create();
    },
    addLoan: function(loan) {
      var view = new LoanView({
        model: loan
      });
      this.$("#loan-list").append(view.render().$el);
    },
    addAllLoans: function() {
      Loans.each(this.addLoan, this);
    }
  });

  var App = new AppView;
});
