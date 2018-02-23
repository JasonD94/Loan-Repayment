// Given a starting balance, a monthly loan payment, and the interest rate of
// a loan, this function returns the total amount of interest paid over the
// time of the loan.
function calculateTotalInterest(startingBalance, monthlyPayment, interestRate) {
  var currentInterest = 0, newBalance = startingBalance, monthCount = 1;
  
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
    singleResult.push("Month #" + monthCount);
    
    // "Starting Balance" is the old newBalance
    var startingBalance = newBalance;
    singleResult.push(startingBalance);    
    
    // Monthly Payment edge case: if StartingBalance is less than monthlyPayment,
    // then startingBalance is all we will pay. Since we can't pay more than
    // the actual principal amount obviously.
    if (startingBalance < monthlyPayment)
    {
      singleResult.push(startingBalance);
    }
    else
    {
      singleResult.push(monthlyPayment);
    }
    
    // Math taken from here
    // https://mozo.com.au/interest-rates/guides/calculate-interest-on-loan
    currentInterest = calculateMonthlyInterest(startingBalance, interestRate);
    principalPaid = monthlyPayment - currentInterest;
    newBalance = newBalance - (monthlyPayment - currentInterest);
    
    singleResult.push(currentInterest);
    singleResult.push(principalPaid);
    
    // New Balance edge case: can't be less than 0, if it's negative, make it 0.
    if (newBalance < 0)
    {
      singleResult.push(0);
    }
    else
    {
      singleResult.push(newBalance);
    }
    
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
