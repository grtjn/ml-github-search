/* global MLSearchController, d3 */
(function () {
  'use strict';

  angular.module('app.landing')
  .controller('LandingCtrl', LandingCtrl);

  LandingCtrl.$inject = ['$scope', '$location', 'messageBoardService', 'SearchModel'];

  // inherit from MLSearchController
  var superCtrl = MLSearchController.prototype;
  LandingCtrl.prototype = Object.create(superCtrl);

  function LandingCtrl($scope, $location, messageBoardService, searchModel) {
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

    angular.extend(ctrl, {
      messageBoardService: messageBoardService,
      ownerChart: top10Chart('Top 10 Owners', 'column', 'owner', 'Owners'),
      typeChart: top10Chart('Top 10 Types', 'pie', 'type', 'Types'),
      languageChart: top10Chart('Top 10 Languages', 'bar', 'language', 'Languages'),
      ownerLanguageChart: cooccurrenceChart('Owners vs Languages', 'bubble', 'owner', 'Owners', 'language', 'Languages'),
      keywords: [],
      noRotate: function(word) {
        return 0;
      },
      cloudEvents: {
        'dblclick': function(tag) {
          // stop propagation
          d3.event.stopPropagation();

          // undo default behavior of browsers to select at dblclick
          var body = document.getElementsByTagName('body')[0];
          window.getSelection().collapse(body,0);

          // custom behavior, for instance search on dblclick
          var qtext = ctrl.mlSearch.getText();
          ctrl.search((qtext ? qtext + ' ' : '') + tag.text.toLowerCase());
        }
      }
    });

    $scope.$watch('ctrl.response', function(newVal) {
      if (newVal && !angular.equals({}, newVal)) {
        updateCloud(newVal);
      }
    }, true);

    function updateCloud(data) {
      if (data && data.facets && data.facets.keyword) {
        var facet = data.facets.keyword;
        ctrl.keywords = [];
        var activeFacets = [];

        // find all selected facet values..
        angular.forEach(ctrl.mlSearch.getActiveFacets(), function(facet, key) {
          angular.forEach(facet.values, function(value, index) {
            activeFacets.push((value.value+'').toLowerCase());
          });
        });

        angular.forEach(facet.facetValues, function(value, index) {
          var q = (ctrl.qtext || '').toLowerCase();
          var val = value.name.toLowerCase();

          // suppress search terms, and selected facet values from the D3 cloud..
          if (q.indexOf(val) < 0 && activeFacets.indexOf(val) < 0) {
            ctrl.keywords.push({name: value.name, score: value.count});
          }
        });
      }
    }

  }

  function top10Chart(title, type, xFacet, xLabel, limit) {
    return {
      options: {
        chart: {
          type: type,
          zoomType: 'xy'
        },
        tooltip: {
          style: {
            padding: 10,
            fontWeight: 'bold'
          },
          shared: true,
          crosshairs: true,
          headerFormat: '<b>{series.name}</b><br/>',
          pointFormatter: function() {
            return (this.xCategory || this.x) + ': <b>' + (this.yCategory || this.y) + '</b><br/>';
          }
        },
        legend: {
          enabled: false
        }
      },
      title: {
        text: title
      },
      xAxis: {
        title: {
          text: xLabel
        },
        labels: (type !== 'bar' ? {
          rotation: -45
        } : {})
      },
      // constraint name for x axis
      //xAxisMLConstraint: xFacet,
      // optional constraint name for categorizing x axis values
      xAxisCategoriesMLConstraint: xFacet,
      yAxis: {
        title: {
          text: 'Frequency'
        }
      },
      // constraint name for y axis ($frequency is special value for value/tuple frequency)
      yAxisMLConstraint: '$frequency',
      zAxis: {
        title: {
          text: null
        }
      },
      // limit of returned results
      resultLimit: limit || 10,
      credits: {
        enabled: true
      }
    };
  }

  function cooccurrenceChart(title, type, xFacet, xLabel, yFacet, yLabel, limit) {
    return {
      options: {
        chart: {
          type: type,
          zoomType: 'xy'
        },
        tooltip: {
          style: {
            padding: 10,
            fontWeight: 'bold'
          },
          shared: true,
          crosshairs: true,
          headerFormat: '<b>{point.x}</b><br/>',
          pointFormatter: function() {
            return this.series.yAxis.categories[this.y] + ': <b>' + this.z + '</b><br/>';
          }
        },
        plotOptions: {
          bubble: {
            softThreshold: true
          }
        },
        legend: {
          enabled: true
        }
      },
      title: {
        text: title
      },
      xAxis: {
        startOnTick: false,
        endOnTick: false,
        title: {
          text: xLabel
        },
        labels: {
          rotation: -45
        }
      },
      // constraint name for x axis
      //xAxisMLConstraint: xFacet,
      // optional constraint name for categorizing x axis values
      xAxisCategoriesMLConstraint: xFacet,
      yAxis: {
        startOnTick: false,
        endOnTick: false,
        title: {
          text: yLabel
        }
      },
      // constraint name for y axis ($frequency is special value for value/tuple frequency)
      //yAxisMLConstraint: yFacet,
      seriesNameMLConstraint: yFacet,
      yAxisCategoriesMLConstraint: yFacet,
      zAxis: {
        title: {
          text: 'Frequency'
        }
      },
      zAxisMLConstraint: '$frequency',
      // limit of returned results
      resultLimit: limit || 30,
      credits: {
        enabled: true
      }
    };
  }
}());
