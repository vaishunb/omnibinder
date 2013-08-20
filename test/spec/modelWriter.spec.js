describe('modelWriter', function () {
  var modelWriter, scope, captureFunctionArgs, binderTypes, $timeout, binder, syncEvents;

  beforeEach(module('Binder'));
  beforeEach(inject(function (_modelWriter_, _binderTypes_, $rootScope, $captureFuncArgs, _$timeout_, _syncEvents_) {
    syncEvents = _syncEvents_;
    modelWriter = _modelWriter_;
    scope = $rootScope;
    captureFunctionArgs = $captureFuncArgs;
    binderTypes = _binderTypes_;
    $timeout = _$timeout_;
    binder = {
      scope: scope,
      model: 'myModel',

    }
  }));

  describe('Array Methods', function () {
    describe('push', function () {
      it('should have a push method', function () {
        expect(typeof modelWriter.push).toBe('function');
      });


      it('should add an element to an existing array', function () {
        binder.scope[binder.model] = [];
        modelWriter.push(binder, {data: 'foo'})
        scope.$apply();
        expect(binder.scope[binder.model]).toEqual(['foo']);
      });


      it('should throw an error if the existing model is something other than array or undefined', function () {
        binder.scope[binder.model] = {};
        expect(function () {
          modelWriter.push(binder, {data: 'foo'});
        }).toThrow(new Error("Cannot call 'push' on a model that is not array or undefined."));
      });


      it('should return the position of the inserted element', function () {
        binder.scope[binder.model] = [];
        expect(modelWriter.push(binder, {data: 'foo'})).toBe(0);
      });
    });


    describe('pop', function () {
      beforeEach(function () {
        binder.type = binderTypes.COLLECTION;
      });


      it('should exist', function () {
        expect(typeof modelWriter.pop).toBe('function');
      });


      it('should complain when popping an undefined model', function () {
        expect(function () {
          modelWriter.pop(binder, {})
        }).toThrow(new Error("Cannot call 'pop' on an undefined model."))
      });


      it('should complain when popping a model that is not an array', function () {
        binder.scope[binder.model] = {};
        expect(function () {
          modelWriter.pop(binder, {});
        }).toThrow(new Error("Cannot call 'pop' on a non-array object."));
      });


      it("should complain when popping a model on a binder without 'collection' type", function () {
        binder.scope[binder.model] = ['foo'];
        binder.type = undefined;
        expect(function () {
          modelWriter.pop(binder, {});
        }).toThrow(new Error('Cannot call pop on a non-collection binder type.'));

        binder.type = binderTypes.OBJECT;
        expect(function () {
          modelWriter.pop(binder, {});
        }).toThrow(new Error('Cannot call pop on a non-collection binder type.'));

        binder.type = binderTypes.COLLECTION;
        expect(function () {
          modelWriter.pop(binder, {});
        }).not.toThrow(new Error('Cannot call pop on a non-collection binder type.'));
      });


      it('should remove and return the last item in an array', function () {
        binder.scope[binder.model] = ['foo', 'bar'];
        expect(modelWriter.pop(binder, {})).toEqual('bar');
        expect(binder.scope[binder.model]).toEqual(['foo']);
      });
    });
  });


  describe('roundTripPrevention', function () {
    // This is not a unit test. Create integration tests.
    // it('should tell $syncResource to ignore changes that only come from the protocol if delta.silent is set to true', function () {
    //   var called = 0
    //     , mySyncResource = $syncResource({protocol: {
    //       change: function () {
    //       called++;
    //     }, subscribe: function (blah, callback) {
    //       callback({data: 'barbaz', silent: true})
    //     }}});

    //   mySyncResource.bind({
    //     scope: scope,
    //     model: 'myModel',
    //     type: binderTypes.COLLECTION
    //   });

    //   scope.myModel = ['foobar'];
    //   scope.$apply();
    //   $timeout.flush();

    //   expect(called).toEqual(1);
    // });
  });


  describe('processChanges', function () {
    it('should exist', function () {
      expect(typeof modelWriter.processChanges).toBe('function');
    });


    it('should accept an array of changes from the protocol', function () {
      var args = captureFunctionArgs(modelWriter.processChanges);
      expect(args[0]).toBe('binder');
      expect(args[1]).toBe('changes');
      expect(args[2]).toBeUndefined();
    });


    it('should execute changes in order', function () {
      scope.myModel = [];
      binder.type = binderTypes.COLLECTION;
      modelWriter.processChanges(binder, [{
        type: syncEvents.NEW,
        name: '0',
        object: ['foo']
      }]);

      expect(scope.myModel).toEqual(['foo']);

      modelWriter.processChanges(binder, [{
        type: syncEvents.NEW,
        name: '1',
        object: ['foo', 'bar']
      }]);

      expect(scope.myModel).toEqual(['foo', 'bar']);

      modelWriter.processChanges(binder, [{
        type: syncEvents.DELETED,
        name: '0',
        object: ['foo']
      }]);

      expect(scope.myModel).toEqual(['bar']);

      modelWriter.processChanges(binder, [{
        type: syncEvents.UPDATED,
        name: '0',
        object: [{foo: 'barrrr'}]
      }]);

      expect(scope.myModel).toEqual([{foo: 'barrrr'}]);
    });
  });


  describe('newFromProtocol', function () {
    it('should exist', function () {
      expect(!!modelWriter.newFromProtocol).toBe(true);
    });


    it('should have the correct function signature', function () {
      var args = captureFunctionArgs(modelWriter.newFromProtocol.toString());
      expect(args[0]).toEqual('binder');
      expect(args[1]).toEqual('change');
      expect(args[2]).toBeUndefined();
    });


    it('should add an item to a collection', function () {
      scope.model = ['foo'];
      modelWriter.newFromProtocol({
        scope: scope,
        model: 'model',
        type: binderTypes.COLLECTION
      }, {
        name: "1",
        object: ['foo', 'bar']
      });

      expect(scope.model[1]).toEqual('bar');
    });
  });


  describe('removedFromProtocol', function () {
    it('should exist', function () {
      expect(!!modelWriter.removedFromProtocol).toBe(true);
    });


    it('should have the correct function signature', function () {
      var args = captureFunctionArgs(modelWriter.removedFromProtocol.toString());
      expect(args[0]).toEqual('binder');
      expect(args[1]).toEqual('delta');
      expect(args[2]).toBeUndefined();
    })


    it('should update the local model based on removal event from protocol', function () {
      scope.model = [{id: 1}, {id: 2}];
      modelWriter.removedFromProtocol({
        scope: scope,
        model: 'model'
      }, {
        data: {id: 1}
      });

      expect(scope.model.length).toEqual(1);
      expect(scope.model[0].id).toEqual(2);
    });


    it('should update the binder.data with the new data', function () {
      var binder = {
        scope: scope,
        model: 'model'
      };
      scope.model = [{id: 1}, {id: 2}];

      modelWriter.removedFromProtocol(binder, {
        data: {id: 1}
      });

      expect(binder.data).toEqual([{id: 2}]);
    });
  });



  describe('updatedFromProtocol', function () {
    it('should exist', function () {
      expect(!!modelWriter.updatedFromProtocol).toBe(true);
    });


    it('should complain if it does not get a valid change object', function () {
      expect(function () {
        modelWriter.updatedFromProtocol({type: binderTypes.OBJECT}, {object: "foobar"})
      }).toThrow(new Error("Change object must contain a name"));
    });


    it('should extend an existing object', function () {
      scope.model = {foo: 'bar'};
      modelWriter.updatedFromProtocol({
        scope: scope,
        model: 'model',
        type: binderTypes.OBJECT
      }, {
        type: syncEvents.UPDATED,
        name: 'foo',
        object: {foo: 'baz'}
      });

      expect(scope.model.foo).toEqual('baz');
    });


    it('should have the correct function signature', function () {
      var args = captureFunctionArgs(modelWriter.updatedFromProtocol.toString());
      expect(args[0]).toEqual('binder');
      expect(args[1]).toEqual('change');
      expect(args[2]).toBeUndefined();
    });


    it('should replace a model at the correct position', function () {
      scope.model = [{}, {foo:'bar'}];
      modelWriter.updatedFromProtocol({
        scope: scope,
        model: 'model',
        type: binderTypes.COLLECTION
      }, {
        name: "1",
        type: syncEvents.UPDATED,
        object: [{}, {
          foo: 'baz'
        }]
      });

      expect(scope.model[1]).toEqual({foo:'baz'});
    });


    it('should merge objects instead of overwriting', function () {
      scope.model = {foo:'bar'};
      modelWriter.updatedFromProtocol({
        scope: scope,
        model: 'model',
        type: binderTypes.OBJECT
      }, {
        name: "newer",
        type: syncEvents.NEW,
        object: {
          foo: 'bar',
          newer: 'property'
        }
      });

      expect(scope.model).toEqual({foo: 'bar', newer: 'property'});
    });
  });
})