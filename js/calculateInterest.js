/*
    File: calculateInterest.js
    Jason Downing
    Contact: jason [AT] downing [DOT] io
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
  
  // Based on user feedback, this feed was confusing. So, use Sweet Alerts to display
  // some information on this feed and some background on the project itself.
  $( "#monthlyPaymentInfo" ).hover(function() {
    TotalMonthlyPaymentInformation();
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

// Information on the "Total Monthly Payment" fields
function TotalMonthlyPaymentInformation() {
  swal({
      icon: "info",
      text: "This field is a monthly payment that is greater than the minimum payment \
      that you would like to compare against for Payoff Date and Total Interest Paid. \
      For example, if your minimum monthly payment was $100, you could enter $200 in this \
      feed to see how much quicker you'd pay off the loan, and how much money you would \
      save in interest."
    });
}

// Nukes all input values
function ClearInputs() {
  $("#balance1").val("");
  $("#minimumPayment1").val("");
  $("#interestRate1").val("");
  $("#totalMonthlyPayment").val("");
}

// Wipes the Amortization Table clean.
function ClearTable() {
  $("#loanCalculationOutput").empty();
  $("#debtFreeDate").empty();
  $("#totalInterestPaid").empty();
  $("#totalMonthlyCalculation").empty();
}

// Calculate Button calls into this function
function OnCalculate() {
  var amortizationTable = GenerateAmortizationTable();
  
  // Infinite loop error check, if we find a -1, we tried to calculate interest
  // on a debt that can never be paid off with the current payment amount!
  if (parseFloat(amortizationTable) == -1 )
  {
    swal({
      icon: "error",
      text: "This payment plan looks to be unreasonable. I tried calculating interest \
      on this debt up to the year 2100, and I was unable to pay off the loan. You likely \
      need to increase the amount you are paying on the loan if at all possible. Other \
      options would include changing your repayment plan, seeking forgiveness on the \
      loan, or contributing more per month whenever possible."
    });
    
    return;
  }
  
  // Make sure to Empty the table every run through!
  var tableBody = $("#loanCalculationOutput").empty();
  $("#debtFreeDate").empty();
  $("#totalInterestPaid").empty();
  
  var totalMonthlyCalculation;
  
  /*
      Calculates total interest paid, and debt paid off date
      Also mainly generates the Amortization Table as a Bootstrap table.
  */
  var debtFreeDate;
  var totalInterest = 0;
  
  // Generate each month's row
  for (var key in amortizationTable)
  {
    // Check for TotalMonthlyCalculation, so we can set that separately.
    if (key == "TotalMonthlyCalculation")
    {
      totalMonthlyCalculation = amortizationTable["TotalMonthlyCalculation"]
      break;
    }
    
    var tr = $("<tr/>").appendTo(tableBody);
    var rowArr = amortizationTable[key];
    
    // Generate the current month's column values
    for (var x = 0; x < rowArr.length; x++)
    {
      // First column is the Month in "MMMM yyyy" format, so no parsing required.
      if (x == 0)
      {
        debtFreeDate = rowArr[x];
        tr.append("<td>" + rowArr[x] + "</td>");
      }
      else
      {
        // Check for interest column to sum up the interest paid.
        if (x == 3)
        {
          totalInterest += rowArr[x]
        }
        
        tr.append("<td>" + parseFloat(rowArr[x]).toFixed(2) + "</td>");
      }
    }
  }
  
  // Set the Debt free by Date and the Total Interest paid amount.
  $("#debtFreeDate").append(debtFreeDate);
  $("#totalInterestPaid").append("$" + parseFloat(totalInterest).toFixed(2));
  
  // If total monthly calculation was ran, we can set the comparision Debt Free
  // and Interest rate.
  if (totalMonthlyCalculation)
  {
    // Information message to let the user know these dates/interest amounts are
    // IF they paid the "Total Monthly Payment" amount.
    var totalMonthlyNote = "<div class='col-sm-12 text-center'><p class='totalMonthlyNote'>Paying the <span class='textItalics'>Total Monthly Payment</span></p></div>";
    
    // Create the comparision div's we need to append to the totalMonthlyCalculation div
    var debtFreeDate = totalMonthlyCalculation["DebtFreeDate"];
    var debtFreeDiv = "<div class='col-sm-4 text-center'><p class='bordersDebtAlt'>DEBT FREE BY: <span class='debtFreeDateClass'>" + debtFreeDate + "</span></p></div>";
    
    // Make sure to parse the Interest Amount as a float, just like the other interest calculations!
    var interestAmount = parseFloat(totalMonthlyCalculation["InterestAmount"]).toFixed(2);
    var interestAmountDiv = "<div class='col-sm-4 text-center'><p class='bordersInterestAlt'>TOTAL INTEREST PAID: <span class='totalInterestPaidClass'>$" + interestAmount + "</span></p></div>";
    
    $("#totalMonthlyCalculation").empty();
    $("#totalMonthlyCalculation").append(totalMonthlyNote);
    $("#totalMonthlyCalculation").append("<div class='col-sm-2 text-center'</div>");
    $("#totalMonthlyCalculation").append(debtFreeDiv);
    $("#totalMonthlyCalculation").append(interestAmountDiv);
    $("#totalMonthlyCalculation").append("<div class='col-sm-2 text-center'</div>");
  }
}

// Grab the UI fields, check if they exist, and then run the CalculateTotalInterest
// function to generate an object that we can parse to generate an amortization table
// for the given loan.
function GenerateAmortizationTable() {
  var startingBalance = $("#balance1").val();
  var monthlyPayment = $("#minimumPayment1").val();
  var interestRate = $("#interestRate1").val();
  var totalMonthlyPayment = $("#totalMonthlyPayment").val();
  
  // Empty checks
  if (!startingBalance)
  {
    // For Sweet Alerts Docs: https://sweetalert2.github.io/
    swal({
      icon: "warning",
      text: "Looks like you forgot to include a Starting Balance. 😢"
    });
    
    return {};
  }
  if (!monthlyPayment)
  {
    swal({
      icon: "warning",
      text: "Looks like you forgot to include a Monthly Payment. 😢"
    });
    
    return {};
  }
  if (!interestRate)
  {
    swal({
      icon: "warning",
      text: "Looks like you forgot to include an Interest Rate. 😢"
    });
    
    return {};
  }
  if (parseFloat(totalMonthlyPayment) < parseFloat(monthlyPayment))
  {
    // For Sweet Alerts Docs: https://sweetalert.js.org/docs/
    swal({
      icon: "error",
      text: "Total Monthly Payment cannot be less than Monthly Payment"
    });
    
    return {};
  }
  
  // Calculate the standard amortization
  var amortizationTable = CalculateTotalInterest(startingBalance, monthlyPayment, interestRate);
  
  // If the user provided a Total Monthly Payment, calculate the amortization for that amount too.
  // But, pull out the Debt Free Date and Interest amount, since we just want those for comparision.
  if (parseFloat(totalMonthlyPayment) > 0)
  {
    var totalMonthlyCalculation = CalculateAdditionalMonthlyPayment(startingBalance, totalMonthlyPayment, interestRate);
    amortizationTable["TotalMonthlyCalculation"] = totalMonthlyCalculation;
  }
  
  return amortizationTable;
}

// Calculates the Debt Free Date / Interest for the "Total Monthly Payment" amount.
function CalculateAdditionalMonthlyPayment(startingBalance, monthlyPayment, interestRate)
{
  // Build up the amortization table, so we can pull out the debt free date and interest amount.
  var amortizationTable = CalculateTotalInterest(startingBalance, monthlyPayment, interestRate);
  
  // Calculate Debt Free Date and Interest Paid
  var debtFreeDate;
  var totalInterest = 0;
  for (var key in amortizationTable)
  {
    var rowArr = amortizationTable[key];
    
    for (var x = 0; x < rowArr.length; x++)
    {
      // First column is the Month in "MMMM yyyy" format, so no parsing required.
      if (x == 0)
      {
        debtFreeDate = rowArr[x];
      }
      else
      {
        // Check for interest column to sum up the interest paid.
        if (x == 3)
        {
          totalInterest += rowArr[x]
        }
      }
    }
  }
  
  var totalMonthlyObj = {};
  totalMonthlyObj["DebtFreeDate"] = debtFreeDate;
  totalMonthlyObj["InterestAmount"] = totalInterest;
  return totalMonthlyObj;
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
  
  // TODO: if the user enters a payment too small, and the interest grows faster
  //       than the payments can pay down the principal, this loop could infinite
  //       loop without the right check!
  
  // Calculate Interest until the loan is paid off.
  while (newBalance > 0)
  {
    var singleResult = [];
    
    // Using datejs, url: http://www.datejs.com/
    // Can tweak this using standard DateTime formats: https://github.com/datejs/Datejs
    singleResult.push(Date.today().add(monthCount).months().toString('MMMM yyyy'));
    
    // "Starting Balance" is the old newBalance
    var startingBalance = newBalance;
    singleResult.push(startingBalance);    
    
    // Monthly Payment edge case: if StartingBalance is less than monthlyPayment,
    // then startingBalance is all we will pay. Since we can't pay more than
    // the actual principal amount obviously.
    if (parseFloat(startingBalance) < parseFloat(monthlyPayment))
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
    
    // Check for infinite loop, if we hit this many months, the user entered too
    // small of a payment and we'd be calculating forever.
    if (monthCount > 984)
    {
      return -1;
    }
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
