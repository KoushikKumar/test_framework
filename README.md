1. "input" Element:: 
    i. When "type" is "text"
        Developer::
        a. $("form").callInputAs("firstname","#firstName","text");
        b. $("#firstName").callInputAs("firstname","text");
        
        User::
        a. "focus on first name"
        b. When focused, whatever you speak will be filled in that input box
        c. "focus out"
        d. "tab" to focus on the next input element(of type text or password)
        
        Remarks::
        a. It supports even if we have added the input element dynamically
        b. Supports even if the form element is autofocused
        
    ii. When "type" is "password"
        Developer::
        a. $("form").callInputAs("password","input:password","password");
        b. $("input:password").callInputAs("password","password");
        
        User::
        a. "focus on password"
        b. When focused, whatever you speak will be filled as password
        c. "focus out"
        d. "tab" to focus on the next element(of type text or password)
        
        Remarks::
        a. It supports even if we have added the input element dynamically
        b. Supports even if the form element is autofocused
        
        
Reserved Words::
1. focus on
2. focus out
3. tab

              