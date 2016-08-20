/*!
 * CallMeAs JavaScript Library v0.0.1
 *
 * Built on top of jquery-2.2.4.js
 *
 */
(function () {

    //Define additional property called as "callInputAs" for $.fn
    //Should be used for <input> tag elements
    /*!
     * eventName :: The name through which user should call
     * chileNode :: Optional parameter. Refer to "input" element selector.This is mandatory when callInputAs() called on $("form")
     * inputType :: "type" of "input" element
     */
    $.fn.callInputAs = function (eventName, childNode, inputType) {
        
        //"this" refers to $("form") or $("<selector related to input element>")
        var self = this;
        
        //eventName and inputType are mandatory arguments
        if (arguments.length < 2) {
            console.log("Missing either eventName or type of input field");
        } else if (arguments.length === 2) {
            eventName = arguments[0];
            inputType = arguments[1];
            childNode = null;
        }

        if (inputType === "text" || inputType === "password") {
            //Creating custom event to focus on input element
            self.on(eventName, childNode, function (event) {
                $(event.target).focus();
            });

            //Creating custom event which triggers "focus" event on input element when the user says "focus on" 
            $(document).on("callMeAs_focusOn", function (e, eventName) {
                if (!childNode) {
                    self.trigger(eventName);
                } else {
                    $(childNode).trigger(eventName);
                }
            });

            $(document).on("callMeAs_focusOut", function (e, focusedElement) {
                //focus out
                focusedElement.blur();
            });
        }
    };

    //Browser should support webkitSpeechRecognition, which listens to user voice
    if (window.hasOwnProperty('webkitSpeechRecognition')) {
        var recognition = new webkitSpeechRecognition();
        
        //focusedElement is required to check hether any input box is focused when the user is speaking
        var focusedElement;
        
        //To keep track of older entries in the input box
        var undoStack = [];
        //To keep track of what all elements are undone
        var redoStack = [];
       
        //functions which are used when the element is focused
        var focusedFunctions = {
            
            //to get the cursor position when the "inputFocusedElement" is created
            "cursorPosition": function (focusedElement) {
                var inputFocusedElement = focusedElement.get(0);
                if (!inputFocusedElement) {
                    return; // No (input) element found
                }
                if ('selectionStart' in inputFocusedElement) {
                    return inputFocusedElement.selectionStart;
                }
            },
            
            //populate "undoStack"
            "updateUndoStack": function (focusedElement, inputValue, isDeleted, isBackspaced) {
                var focusedElementClone = $.extend(true, {}, focusedElement);
                var focusedElemProps = { 
                                            "focusedElement": focusedElementClone,
                                            "cursorPosition": this.cursorPosition(focusedElementClone),
                                            "value": inputValue,
                                            "isDeleted": isDeleted,
                                            "isBackspaced": isBackspaced
                                       };
                undoStack.push(focusedElemProps);
                //whenever undostack is populated, clear redoStack
                redoStack = [];
            }
        };
        
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.lang = "en-US";
        recognition.start();

        recognition.onresult = function (input) {

            //convert user voice to string
            var userInput = input.results[input.results.length - 1][input.results[input.results.length - 1].length - 1].transcript;
            
            //remove left and right space edges
            userInput = $.trim(userInput);
            console.log(userInput);
            var userInputWords = userInput.split(' ');
            
            //set "focusedElement" only if the input is focused
            if ($(":focus").length > 0) {
                focusedElement = $(":focus");
                //focusedElement should be set only if the element is "input" and "type" is "text" or "password"
                if (!(focusedElement[0].tagName === "INPUT" && (focusedElement[0].type === "text" || focusedElement[0].type === "password"))) {
                    focusedElement = null;
                }
            }

            //check whether any input element is focused
            if (focusedElement) {
                
                // focusOut from input element when the user says "focus out"
                if (userInputWords[0] === "focus" && userInputWords[1] === "out") {
                    //trigger focus out event
                    $(document).trigger("callMeAs_focusOut", [focusedElement]);
                    focusedElement = null;
                    return;
                }
                
                //when the user says "tab"
                if (userInputWords[0] === "tab") {
                    focusedElement.next().focus();
                    focusedElement = $(":focus");
                    return;
                }
                
                //when the user says "delete"
                if (userInputWords[0] === "delete") {
                    var emptyString = '';
                    var currentValue = focusedElement.val();
                    focusedElement.val(emptyString);
                    //update "undoStack" with the current value
                    focusedFunctions.updateUndoStack(focusedElement, currentValue, true);
                    return;
                }
                
                //when the user says "backspace" then remove the character beside the cursor 
                if (userInputWords[0] === "backspace") {
                    
                    var cursorPosition = focusedFunctions.cursorPosition(focusedElement);
                    
                    if (cursorPosition && cursorPosition > 0) {
                        var presentValue = focusedElement.val();
                        var modifiedValue; // this will be the value after removing the character
                        //remove character
                        if (cursorPosition === presentValue.length) {
                            modifiedValue = presentValue.slice(0, cursorPosition - 1);
                        } else {
                            modifiedValue = presentValue.slice(0, cursorPosition - 1) + presentValue.slice(cursorPosition);
                        }
                        
                        
                        //set the modified value
                        focusedElement.val(modifiedValue);
                        //update "undoStack" with the current value
                        focusedFunctions.updateUndoStack(focusedElement, presentValue, false, true);
                        //set the cursor to the cursorPosition - 1
                        focusedElement.get(0).setSelectionRange(cursorPosition - 1, cursorPosition - 1);
                    }
                    return;
                }
                
                //when the user says "undo" then input element should have the immediate old value
                if (userInputWords[0] === "undo") {
                    //last populated element of "undoStack"
                    var latestInputVal = undoStack.pop();
                    if (latestInputVal) {
                        var focusedElement = latestInputVal.focusedElement;
                        var value = latestInputVal.value;
                        var cursorPosition = latestInputVal.cursorPosition;
                        //populate redoStack
                        redoStack.push(latestInputVal);
                        if (!(latestInputVal.isDeleted || latestInputVal.isBackspaced)) {
                            if (undoStack.length > 0) {
                                var presentValue = focusedElement.val();
                                //remove the stacked value from present value based on stacked cursor position
                                var previousValue = presentValue.slice(0, cursorPosition) + presentValue.slice(cursorPosition + value.length);
                                focusedElement.val(previousValue);
                            } else {
                                //initial state when the input elements are empty
                                focusedElement.val('');
                            }
                        } else {
                            //we are storing the values present in input elements, before the actual delete and backspace is applied
                            focusedElement.val(value);
                        }
                    }
                    return;
                }
                
                //when the user says "redo" then input element should have the next latest value
                if (userInputWords[0] === "redo") {
                    //last populated element of "redoStack"
                    var nextLatestInputVal = redoStack.pop();
                    if (nextLatestInputVal) {
                        var focusedElement = nextLatestInputVal.focusedElement;
                        var value = nextLatestInputVal.value;
                        var cursorPosition = nextLatestInputVal.cursorPosition;
                        undoStack.push(nextLatestInputVal);
                        if (nextLatestInputVal.isDeleted) {
                            //the input value should be empty
                            focusedElement.val('');
                        } else if (nextLatestInputVal.isBackspaced) {
                            var presentValue = focusedElement.val();
                            //remove the backspaced character from the present value
                            var latestValue = presentValue.slice(0, cursorPosition) + presentValue.slice(cursorPosition+1);
                            focusedElement.val(latestValue);
                        } else {
                            var presentValue = focusedElement.val();
                            var latestValue = presentValue+value;
                            focusedElement.val(latestValue);
                        }
                    }
                    return;
                }
                
                var newValue = focusedElement.val() + userInput;
                //populate "undoStack" with the userInput
                focusedFunctions.updateUndoStack(focusedElement,userInput);
                //Append to the existing value of input element
                focusedElement.val(newValue);
                
                return;
            }

            // when the user starts the sentence with "focus on" 
            if (userInputWords[0] === "focus" && userInputWords[1] === "on") {
                var arg = [];
                for (var i = 2; i < userInputWords.length; i++) {
                    arg.push(userInputWords[i]);
                }
                
                //trigger the event which makes the input element to focus
                $(document).trigger("callMeAs_focusOn", [arg.join('')]);   
                return;
            }
        };
           
        recognition.onend = function() {
            //To keep the listener always on
            recognition.start();
        };

        recognition.onerror = function (event) {
            console.log("error occured: " + event);
            //To keep the listener always on
            recognition.start();
        }
    }
}());