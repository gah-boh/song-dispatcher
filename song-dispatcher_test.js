describe('Song Dispatcher', function() {

    var sut;

    beforeEach(module('songFlux'));

    describe('getDispatcher', function() {
        var moduleA;
        var moduleB;

        beforeEach(function() {
            moduleA = angular.module('moduleA', []);
            moduleB = angular.module('moduleB', []);
        });

        beforeEach(inject(function(songFactory) {
            sut = songFactory;
        }));

        it('should return a new dispatcher for a module if has not been created', function() {
            var dispatcher = sut.getDispatcher(moduleA.name);
            expect(dispatcher.register).toBeDefined();
        });

        it('should return a dispatcher for a module if it already has been created', function() {
            var firstRequest = sut.getDispatcher(moduleA.name);
            var secondRequest = sut.getDispatcher(moduleA.name);
            expect(firstRequest).toBe(secondRequest);
        });

        it('should return a different dispatcher per module', function() {
            var dispatcherA = sut.getDispatcher(moduleA.name);
            var dispatcherB = sut.getDispatcher(moduleB.name);
            expect(dispatcherA).not.toBe(dispatcherB);
        });

        it('should throw an error if the module does not exist', function() {
            expect(function(){
                sut.getDispatcher('idonotexist');
            }).toThrowError();
        });

    });

    describe('dispatcher', function() {

        var testModule;

        beforeEach(function() {
            testModule = angular.module('testModule', []);
        });

        beforeEach(inject(function(songFactory) {
            sut = songFactory.getDispatcher(testModule.name);
        }));

        describe('construction', function() {

            it('should have an id that contains the module name', function() {
                expect(sut.id).toBe('D_testModule');
            });

        });

        describe('register', function() {

            var Action;

            beforeEach(function() {
                Action = function Action() {};
            });

            it('should return an id prefixed by the moduleId and action constructor name', function() {
                var callback = jasmine.createSpy('callback');
                var id = sut.register(Action, callback);
                expect(id).toBe('D_testModule_Action_1');
            });

            it('should return a new id for every registration', function() {
                var callbackOne = jasmine.createSpy('callbackOne');
                var callbackTwo = jasmine.createSpy('callbackTwo');
                var idOne = sut.register(Action, callbackOne);
                var idTwo = sut.register(Action, callbackTwo);
                expect(idOne).toBe('D_testModule_Action_1');
                expect(idTwo).toBe('D_testModule_Action_2');
            });

        });
    
        describe('dispatch', function() {

            var Action;
            var callback;

            beforeEach(function() {
                Action = function Action() {};
                callback = jasmine.createSpy('callback');

                sut.register(Action, callback);
            });

            it('should call the callback registered for the specific action', function() {
                var action = new Action();
                sut.dispatch(action);
                expect(callback).toHaveBeenCalled();
            });

            it('should set _currentCallbacks to object of id', function() {
                spyOn(sut, '_stopDispatching');
                var action = new Action();
                sut.dispatch(action);
                expect(sut._currentCallbacks.D_testModule_Action_1).toBe(callback);
            });

            it('should be able to dispatch an array of actions', function() {
                var toDispatch = [new Action(), new Action(), new Action()];
                toDispatch.forEach(function(action) {
                    sut.dispatch(action);
                });
                expect(callback.calls.count()).toBe(3);
            });

        });

        describe('_stopDispatching', function() {

            it('should set _currentCallbacks to null', function() {
                sut._currentCallbacks = {};
                sut._stopDispatching();
                expect(sut._currentCallbacks).toBe(null);
            });

        });

        describe('unregister', function() {
            var Action;
            var callback;
            var registrationId;

            beforeEach(function() {
                Action = function Action() {};
                callback = jasmine.createSpy('callback');

                registrationId = sut.register(Action, callback);
            });

            it('should not call the callback once unregistered', function() {
                sut.unregister(registrationId);
                sut.dispatch(new Action());
                expect(callback).not.toHaveBeenCalled();
            });

        });

    });

    describe('createAction', function() {
        var TestAction;
        var createdAction;

        var testModule;
        var dispatcherMock;

        beforeEach(function() {
            testModule = angular.module('testModule', []);
        });

        beforeEach(inject(function(songFactory) {
            sut = songFactory;
            dispatcherMock = jasmine.createSpyObj('dispatcherMock', ['dispatch']);
            spyOn(sut, 'getDispatcher').and.returnValue(dispatcherMock);
        }));

        beforeEach(function() {
            TestAction = function TestAction(aProp) {
                this.aProp = aProp;
            };
            TestAction.prototype.customMethod = jasmine.createSpy('customMethod');

            createdAction = sut.createAction(TestAction, 'testModule');
        });

        it('should return a factory function for the action', function() {
            var result = createdAction();
            expect(result instanceof TestAction).toBe(true);
        });

        it('should create an instance of the action with the same constructor', function() {
            var result = createdAction();
            expect(result.constructor).toBe(TestAction);
        });

        it('the new instance should have a dispatcher property', function() {
            var result = createdAction();
            expect(result.dispatcher).toBe(dispatcherMock);
        });

        it('should have kept the actions constructor function logic', function() {
            var result = createdAction('testProp');
            expect(result.aProp).toBe('testProp');
        });

        it('should have a dispatch method from the base action', function() {
            var result = createdAction();
            expect(result.dispatch).toBeDefined();
        });

        it('dispatch should call the instances dispatcher', function() {
            var result = createdAction();
            result.dispatch();
            expect(dispatcherMock.dispatch).toHaveBeenCalledWith(result);
        });

        it('should add methods from the custom action prototype', function() {
            var result = createdAction();
            expect(result.customMethod).toBeDefined();
        });

    });

});

