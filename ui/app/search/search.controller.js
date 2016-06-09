/* global MLSearchController */
(function () {
  'use strict';

  angular.module('app.search')
    .factory('SearchModel', SearchModel)
    .controller('SearchCtrl', SearchCtrl);

  SearchModel.$inject = ['MLSearchFactory'];
  SearchCtrl.$inject = ['$scope', '$location', 'userService', 'SearchModel'];

  // inherit from MLSearchController
  var superCtrl = MLSearchController.prototype;
  SearchCtrl.prototype = Object.create(superCtrl);

  function SearchModel(searchFactory) {
    var mlSearch = searchFactory.newContext();
    return {
      mlSearch: mlSearch
    };
  }

  function SearchCtrl($scope, $location, userService, searchModel) {
    var ctrl = this;

    superCtrl.constructor.call(ctrl, $scope, $location, searchModel.mlSearch);

    function urlChanged() {
      var params = _.chain( $location.search() )
        .omit( ctrl.mlSearch.getParamsKeys() )
        .merge( ctrl.mlSearch.getParams() )
        .value();
      return !_.isEmpty($location.$$search) && !_.isEqual($location.$$search, params);
    }

    //ctrl.init();
    (function init() {
      // monitor URL params changes (forward/back, etc.)
      ctrl.$scope.$on('$locationChangeSuccess', ctrl.locationChange.bind(ctrl));

      // capture initial URL params in mlSearch and ctrl
      if ( ctrl.parseExtraURLParams ) {
        ctrl.parseExtraURLParams();
      }

      if (ctrl.mlSearch.results.results && !urlChanged()) {
        ctrl.page = ctrl.mlSearch.page;
        ctrl.qtext = ctrl.mlSearch.qtext;
        ctrl.response = ctrl.mlSearch.results;
        ctrl.updateURLParams();
      } else {
        ctrl.mlSearch.fromParams().then( ctrl._search.bind(ctrl) );
      }
    })();

    ctrl.setSnippet = function(type) {
      ctrl.mlSearch.setSnippet(type);
      ctrl.search();
    };

    $scope.$watch(userService.currentUser, function(newValue) {
      ctrl.currentUser = newValue;
    });

    ctrl.resultLabel = function(result) {
      return result.uri.replace(/^\/([^\/]+)\/(.*)\.json$/, '$1 / $2');
    };
  }
}());
