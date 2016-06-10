(function () {
  'use strict';

  angular.module('app.root')
    .factory('SearchModel', SearchModel)
    .controller('RootCtrl', RootCtrl);

  SearchModel.$inject = ['MLSearchFactory'];

  function SearchModel(searchFactory) {
    var mlSearch = searchFactory.newContext();
    return {
      mlSearch: mlSearch
    };
  }

  RootCtrl.$inject = ['messageBoardService'];

  function RootCtrl(messageBoardService) {
    var ctrl = this;

    angular.extend(ctrl, {
      messageBoardService: messageBoardService
    });
  }

}());
