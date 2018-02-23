/*
    File: calculateInterest.js
    Jason Downing - student at UMass Lowell in 91.461 GUI Programming I
    Contact: jdowning@cs.uml.edu or jason_downing@student.uml.edu
    MIT Licensed - see http://opensource.org/licenses/MIT for details.
    Anyone may freely use this code. Just don't sue me if it breaks stuff.
    Created: 2/22/2018

    This JS file contains loan interest calculation functions
*/

// Wrapping the click listener in a ready so that the DOM will be all loaded
// when this fires up.
$(document).ready(function () {
  // Calculates Repayment table
  $( "#calculateBtn" ).click(function() {
    OnCalculate();
    
    // NOTE: button tags by default use Submit. I'm doing this to cancel the
    // default, and prevent the page from refreshing. See this post for more info: 
    // https://stackoverflow.com/questions/23420795/why-would-a-button-click-event-cause-site-to-reload-in-a-bootstrap-form
    event.preventDefault();
  });
  // Clears the Amortization Table
  $( "#clearTable" ).click(function() {
    ClearTable();
    event.preventDefault();
  });
  // Wipes all Loan inputs
  $( "#clearInputs" ).click(function() {
    ClearInputs();
    event.preventDefault();
  });
});

// Nukes all input values
function ClearInputs() {
  $("#balance1").val("");
  $("#minimumPayment1").val("");
  $("#interestRate1").val("");
}

// Wipes the Amortization Table clean.
function ClearTable() {
  $("#loanCalculationOutput").empty();
}

// Calculate Button calls into this function
function OnCalculate() {
  var amortizationTable = GenerateAmortizationTable();
  
  // Make sure to Empty the table every run through!
  var tableBody = $("#loanCalculationOutput").empty();
  
  /*
      Get totals to display the first table like:
      
      TOTAL MONTHS | TOTAL INTEREST PAID
  
  */
  var totalMonths = 0;
  var totalInterest = 0;
  
  // Generate each month's row
  for (var key in amortizationTable)
  {
    var tr = $("<tr/>").appendTo(tableBody);
    var rowArr = amortizationTable[key];
    
    // Generate the current month's column values
    for (var x = 0; x < rowArr.length; x++)
    {
      // Just print integers for Month #'savePreferences
      if (x == 0)
      {
        tr.append("<td>" + parseFloat(rowArr[x]).toFixed(0) + "</td>");
      }
      else
      {
        tr.append("<td>" + parseFloat(rowArr[x]).toFixed(2) + "</td>");
      }
    }
  }
}

// Grab the UI fields, check if they exist, and then run the CalculateTotalInterest
// function to generate an object that we can parse to generate an amortization table
// for the given loan.
function GenerateAmortizationTable() {
  var startingBalance = $("#balance1").val();
  var monthlyPayment = $("#minimumPayment1").val();
  var interestRate = $("#interestRate1").val();
  
  // Empty checks
  if (!startingBalance)
  {
    // For Sweet Alerts Docs: https://sweetalert.js.org/docs/
    swal({
      icon: "warning",
      text: "Looks like you forgot to include a Starting Balance. 😢"
    });
    
    return {};
  }
  if (!monthlyPayment)
  {
    // For Sweet Alerts Docs: https://sweetalert.js.org/docs/
    swal({
      icon: "warning",
      text: "Looks like you forgot to include a Monthly Payment. 😢"
    });
    
    return {};
  }
  if (!interestRate)
  {
    // For Sweet Alerts Docs: https://sweetalert.js.org/docs/
    swal({
      icon: "warning",
      text: "Looks like you forgot to include an Interest Rate. 😢"
    });
    
    return {};
  }
  
  var amortizationTable = CalculateTotalInterest(startingBalance, monthlyPayment, interestRate);
  
  return amortizationTable;
}

// Given a starting balance, a monthly loan payment, and the interest rate of
// a loan, this function returns the total amount of interest paid over the
// time of the loan.
function CalculateTotalInterest(startingBalance, monthlyPayment, interestRate) {
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
    singleResult.push(monthCount);
    
    // "Starting Balance" is the old newBalance
    var startingBalance = newBalance;
    singleResult.push(startingBalance);    
    
    // Monthly Payment edge case: if StartingBalance is less than monthlyPayment,
    // then startingBalance is all we will pay. Since we can't pay more than
    // the actual principal amount obviously.
    if ( (startingBalance < monthlyPayment) && (startingBalance != 0))
    {
      singleResult.push(startingBalance);
    }
    else
    {
      singleResult.push(monthlyPayment);
    }
    
    // Math taken from here
    // https://mozo.com.au/interest-rates/guides/calculate-interest-on-loan
    currentInterest = CalculateMonthlyInterest(startingBalance, interestRate);
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
function CalculateMonthlyInterest(currentBalance, interestRate) {
  // Convert InterestRate to a percent
  interestRate = interestRate / 100;
  
  // Interest = (interest rate / 12 payments per year) * loan principal
  return ( (interestRate / 12) * currentBalance );
}
