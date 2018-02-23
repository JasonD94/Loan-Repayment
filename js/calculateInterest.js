// Given a starting balance, a monthly loan payment, and the interest rate of
// a loan, this function returns the total amount of interest paid over the
// time of the loan.
function calculateTotalInterest(startingBalance, monthlyPayment, interestRate) {
  var totalInterest = 0, currentInterest = 0, newBalance = startingBalance, 
      monthCount = 1;
  
  // JSON results object for displaying in a table
  var resultsObj = {};
  
  /*
      Ideally this would contain:
      
      ResultsObj {
        Month1: {1000, 100, 20, 80, 920}
        ...
        MonthN: {10, 10, 0, 10, 0}
      }
  
      ResultsObject is an object with rows of lists
      Each list has the following:
      [Month #Number, StartingBalance, Repayment, InterestPaid, PrincipalPaid, NewBalance]
  */
  
  // Calculate Interest until the loan is paid off.
  while (newBalance > 0)
  {
    var singleResult = [];
    singleResult.Push("Month #" + monthCount);
    singleResult.Push(newBalance);
    
    // Math taken from here
    // https://mozo.com.au/interest-rates/guides/calculate-interest-on-loan
    currentInterest = calculateMonthlyInterest(startingBalance, interestRate);
    principalPaid = monthlyPayment - currentInterest;
    newBalance = newBalance - (monthlyPayment - currentInterest);
    totalInterest += currentInterest;
    
    // Note: going to need to handle when monthlyPayment is less than the normal amount.
    // Obviously if your payment is normally $100 a month, but you only owe $50, that
    // means the payment for that month is just $50.
    singleResult.Push(monthlyPayment);
    singleResult.Push(currentInterest);
    singleResult.Push(principalPaid);
    singleResult.Push(newBalance);
    
    // Add a row into the results object
    resultsObj["Month" + monthCount] = singleResult;
    monthCount++;
  }
  
  return resultsObj;
}

// Calculates one month of interest
function calculateMonthlyInterest(currentBalance, interestRate) {
  // Convert InterestRate to a percent
  interestRate = interestRate / 100;
  
  // Interest = (interest rate / 12 payments per year) * loan principal
  return ( (interestRate / 12) * currentBalance );
}