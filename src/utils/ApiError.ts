class ApiError  {
    
    // defing the type of the input
    success: boolean; 
    errors: any;
    message: string ; 
    
    constructor(
        message= "Something went wrong",
        errors = {}
    ) {
       
        
        this.success = false ; 
        this.message = message; 
        this.errors = errors;

    }
}

export default ApiError;