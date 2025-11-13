class ApiResponse  {

    // defing the type of the input 
    message : string ; 
    data : any ; 
    success : boolean ; 
   
    
    constructor(message = "Success Fully Get The Output" , data = {} ){
        this.success = true ; 
        this.message = message ; 
        this.data = data 
    }
}


export default ApiResponse ; 