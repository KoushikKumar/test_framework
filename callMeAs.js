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
                if(!(focusedElement[0].tagName === "INPUT" && focusedElement[0].type === "text" || focusedElement[0].type === "password")){
                    focusedElement = null;
                }
            }  

            //check whether any input element is focused
            if (focusedElement) {
                // focusOut from input element when the user says "focus out"
                if (userInputWords[0] === "focus" && userInputWords[1] === "out") {
                    //trigger focus out event
                    $(document).trigger("callMeAs_focusOut",[focusedElement]);
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
                if(userInputWords[0] === "delete"){
                    focusedElement.val('');
                    return;
                }
                
                //Append to the existing value of input element
                focusedElement.val(focusedElement.val() + userInput);
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