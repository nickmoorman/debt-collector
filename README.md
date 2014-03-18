# Debt Collector

Debt Collector is a small app I came up with while trying to figure out the best way to pay off all of my credit cards, student loans, etc.  Its aim is to provide users with an easy way to evaluate their current payoff strategy and determine the optimal way to move forward.

Currently, the app only allows you to add your debt accounts and model simple consolidation loans to determine the payoff timeframe and the amount of interest you'll pay.  In the future, you'll be able to mode consolidation loans with much more variance, and the app will be able to help you find the best balance of payments on each account.

Stay tuned for updates!

## Getting started

To run this app, simply clone the repository, run `npm install` to install dependencies, then run `node app` to start the server, available at [http://localhost:3000](http://localhost:3000).

## Under the Hood

This app is built with:
- [Node.js](http://nodejs.org/) (currently only a simple server, but server-side number crunching will be added soon)
- [Jade](http://jade-lang.com/), for simple HTML pages
- [Backbone.js](http://backbonejs.org/), the heart of the app
- [Underscore.js](http://underscorejs.org/), for its Javascript templating engine
- [Backbone.localStorage](https://github.com/jeromegn/Backbone.localStorage), to store entered data
- [jQuery](http://jquery.com/), for basic DOM manipulation
- [Foundation](http://foundation.zurb.com/), as a styling framework
- [MathJax](http://www.mathjax.org/), to render underlying equations
