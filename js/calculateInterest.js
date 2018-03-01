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
    // Also seems like adding type="button" to the button works too in FireFox
    event.preventDefault();
  });
  
  // Based on user feedback, this feed was confusing. So, use Sweet Alerts to display
  // some information on this feed and some background on the project itself.
  $( "#monthlyPaymentInfo" ).click(function() {
    TotalMonthlyPaymentInformation();
    event.preventDefault();
  });
  
  // Also, use onhover to change the "i" icon between primary and secondary color icons.
  $( "#monthlyPaymentInfo" ).hover(
    function() {
      $( "#monthlyPaymentInfo" ).addClass("infoIconPrimary");    // Make Icon change color
    },
    function() {
      $( "#monthlyPaymentInfo" ).removeClass("infoIconPrimary");    
    }
  );
  
  // Wipes all Loan inputs and the Amortization table
  $( "#clearInputs" ).click(function() {
    ClearInputs();
    ClearTable();
    event.preventDefault();
  });
  
  // Resize the plotly on window size change. Plotly has a "resize" option in the 
  // layout option, but doesn't seem like it works very well compared to this.
  // There's an entire code snippet for doing this on the Plotlyjs docs page:
  // https://plot.ly/javascript/responsive-fluid-layout/#responsive-/-fluid-layout
  window.onresize = function() {
      Plotly.Plots.resize('plotlyGraph');
      Plotly.Plots.resize('vsGraph');
  };
});

// Information on the "Total Monthly Payment" fields
function TotalMonthlyPaymentInformation() {
  swal({
      html: true,
      icon: "info",
      title: "What this field is",
      text: "This field is a monthly payment that is greater than the minimum payment that you would like to compare against for Payoff Date and Total Interest Paid. \n For example, if your minimum monthly payment was $100, you could enter $200 in this feild to see how much quicker you'd pay off the loan, and how much money you would \
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
  $("#additionalMonthlyCalculation").empty();
  $('#plotlyGraph').empty();
  $('#vsGraph').tab('hide');
}

// Calculate Button calls into this function
function OnCalculate() {
  var amortizationTable = GenerateAmortizationTable();
  
  // Infinite loop error check, if we find a -1, we tried to calculate interest
  // on a debt that can never be paid off with the current payment amount!
  if ( parseFloat(amortizationTable) == -1 )
  {
    swal({
      icon: "error",
      text: "This payment plan looks to be unreasonable. I tried calculating interest \
      on this debt up to the year 2100, and I was unable to pay off the loan. \n \
      You likely need to increase the amount you are paying on the loan if at all possible. \
      Other  options include: \n \
      - adjusting your repayment plan \n \
      - seeking forgiveness on the loan \n \
      - contributing more per month whenever possible."
    });
    
    return;
  }
  // Check for missing input, so we don't display a blank plotly graph!
  else if ( parseFloat(amortizationTable) == -2 )
  {
    return;
  }
  
  // Make sure to Empty the table every run through!
  var tableBody = $("#loanCalculationOutput").empty();
  $("#debtFreeDate").empty();
  $("#totalInterestPaid").empty();
  
  var additionalMonthlyCalculation;
  
  /*
      Calculates total interest paid, and debt paid off date
      Also mainly generates the Amortization Table as a Bootstrap table.
  */
  var debtFreeDate;
  var totalInterest = 0;
  
  // Array of months will be our X axis. Y axis will be interest paid, 
  // principal paid, and the new balance over time.
  var monthsArr = [];
  var balanceArr = [];
  var interestArr = [];
  var principalArr = [];
  var totalInterestArr = [];
  
  // Generate each month's row
  for (var key in amortizationTable)
  {
    // Check for AdditionalMonthlyCalculation, so we can set that separately.
    if (key == "AdditionalMonthlyCalculation")
    {
      additionalMonthlyCalculation = amortizationTable["AdditionalMonthlyCalculation"]
      break;
    }
    
    var tr = $("<tr/>").appendTo(tableBody);
    var amortizationRow = amortizationTable[key];
    
    // Month is in "MMMM yyyy" format
    debtFreeDate = amortizationRow["Month"];
    tr.append("<td>" + amortizationRow["Month"] + "</td>");
    
    // Abbreviate the month for the plot
    var date = Date.parse(amortizationRow["Month"]);
    monthsArr.push(date.toString('MMM yyyy'));

    // The date is the only one that doesn't get parsed as a float.
    // Everythign else just gets appended to the current table row.
    tr.append("<td>" + parseFloat(amortizationRow["StartingBalance"]).toFixed(2) + "</td>");
    tr.append("<td>" + parseFloat(amortizationRow["Repayment"]).toFixed(2) + "</td>");
    tr.append("<td>" + parseFloat(amortizationRow["InterestPaid"]).toFixed(2) + "</td>");
    tr.append("<td>" + parseFloat(amortizationRow["PrincipalPaid"]).toFixed(2) + "</td>");
    tr.append("<td>" + parseFloat(amortizationRow["TotalInterestPaid"]).toFixed(2) + "</td>");
    tr.append("<td>" + parseFloat(amortizationRow["NewBalance"]).toFixed(2) + "</td>");

    // Interest values to display and plot.
    interestArr.push(amortizationRow["InterestPaid"]);
    totalInterestArr.push(amortizationRow["TotalInterestPaid"]);
    totalInterest = amortizationRow["TotalInterestPaid"];

    // We also want the Principal Paid and New Balance to plot them
    principalArr.push(amortizationRow["PrincipalPaid"]);
    balanceArr.push(amortizationRow["NewBalance"]);
  }
  
  // Set the Debt free by Date and the Total Interest paid amount.
  $("#debtFreeDate").append(debtFreeDate);
  $("#totalInterestPaid").append("$" + parseFloat(totalInterest).toFixed(2));
  
  // If total monthly calculation was ran, we can set the comparision Debt Free
  // and Interest rate.
  if (additionalMonthlyCalculation)
  {
    // Information message to let the user know these dates/interest amounts are
    // IF they paid the "Total Monthly Payment" amount.
    var totalMonthlyNote = "<div class='col-sm-12 text-center'><p class='totalMonthlyNote'>Paying the <span class='textItalics'>Total Monthly Payment</span></p></div>";
    
    // Create the comparision div's we need to append to the additionalMonthlyCalculation div
    var debtFreeDate = additionalMonthlyCalculation["DebtFreeDate"];
    var debtFreeDiv = "<div class='col-sm-6 text-center'><p class='bordersDebtAlt'>DEBT FREE BY: <span class='debtFreeDateClass'>" + debtFreeDate + "</span></p></div>";
    
    // Make sure to parse the Interest Amount as a float, just like the other interest calculations!
    var interestAmount = parseFloat(additionalMonthlyCalculation["InterestAmount"]).toFixed(2);
    var interestAmountDiv = "<div class='col-sm-6 text-center'><p class='bordersInterestAlt'>TOTAL INTEREST PAID: <span class='totalInterestPaidClass'>$" + interestAmount + "</span></p></div>";
    
    $("#additionalMonthlyCalculation").empty();
    $("#additionalMonthlyCalculation").append(totalMonthlyNote);
    $("#additionalMonthlyCalculation").append(debtFreeDiv);
    $("#additionalMonthlyCalculation").append(interestAmountDiv);
    
    // Also, plot the Minimum payment interest vs the Larger payment interest
    GenerateMinVsLargerPlot(monthsArr, totalInterestArr, additionalMonthlyCalculation["InterestArray"]);
  }
  
  // Generate the Plot
  GenerateInterestOverTimePlot(monthsArr, interestArr, principalArr);
}

// Plots interest paid vs principal paid (y-axis) over time (x axis)
function GenerateInterestOverTimePlot(monthsArr, interestArr, principalArr) 
{
  // Plotly.js graphs
  var interestPlot = {
    x: monthsArr,
    y: interestArr,
    name: 'Interest',
    type: 'scatter'
  };
  var principalPlot = {
    x: monthsArr,
    y: principalArr,
    name: 'Principal',
    type: 'scatter'
  };
  var data = [ interestPlot, principalPlot ];
  var layout = {
    title: '<b>Interest vs Principal Paid<br> on the Loan Over Time</b>',
    "titlefont": {
    "size": 16,
    },
    margin: {
      l: 50,
      r: 50,
      b: 100,
      t: 100,
      pad: 5
    },
    xaxis: {
      title: 'Months'
    },
    yaxis: {
      title: 'Interest'
    },
    autosize: true
  };
  
  Plotly.newPlot('plotlyGraph', data, layout, {displayModeBar: false});
}

// Plots Minimum Interest paid vs Larger Interest (y-axis) paid over time (x-axis)
function GenerateMinVsLargerPlot(monthsArr, minInterestArr, largerInterestArr)
{
  // Plotly.js graphs
  var minInterestPlot = {
    x: monthsArr,
    y: minInterestArr,
    name: 'Minimum Payment',
    type: 'scatter'
  };
  var largerInterestPlot = {
    x: monthsArr,
    y: largerInterestArr,
    name: 'Larger Payment',
    type: 'scatter'
  };
  var data = [ minInterestPlot, largerInterestPlot ];
  var layout = {
    title: '<b>Minimum Monthly Payment Interest Paid vs <br>Larger Monthly Interest Paid on the Loan Over Time</b>',
    "titlefont": {
    "size": 16,
    },
    margin: {
      l: 50,
      r: 50,
      b: 100,
      t: 100,
      pad: 5
    },
    xaxis: {
      title: 'Months'
    },
    yaxis: {
      title: 'Interest'
    },
    autosize: true
  };
  
  Plotly.newPlot('vsGraph', data, layout, {displayModeBar: false});
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
    
    return -2;
  }
  if (!monthlyPayment)
  {
    swal({
      icon: "warning",
      text: "Looks like you forgot to include a Monthly Payment. 😢"
    });
    
    return -2;
  }
  if (!interestRate)
  {
    swal({
      icon: "warning",
      text: "Looks like you forgot to include an Interest Rate. 😢"
    });
    
    return -2;
  }
  if (parseFloat(totalMonthlyPayment) < parseFloat(monthlyPayment))
  {
    // For Sweet Alerts Docs: https://sweetalert.js.org/docs/
    swal({
      icon: "error",
      text: "Total Monthly Payment cannot be less than Monthly Payment"
    });
    
    return -2;
  }
  
  // Calculate the standard amortization
  var amortizationTable = CalculateTotalInterest(startingBalance, monthlyPayment, interestRate);
  
  // If the user provided a Total Monthly Payment, calculate the amortization for that amount too.
  // But, pull out the Debt Free Date and Interest amount, since we just want those for comparision.
  if (parseFloat(totalMonthlyPayment) > 0)
  {
    var additionalMonthlyCalculation = CalculateAdditionalMonthlyPayment(startingBalance, totalMonthlyPayment, interestRate);
    amortizationTable["AdditionalMonthlyCalculation"] = additionalMonthlyCalculation;
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
  
  // Interest Array for comparing to Minimum monthly payment.
  var interestArr = [];
  
  for (var key in amortizationTable)
  {
    var amortizationRow = amortizationTable[key];
    
    // Get the Month, this will end up being the DebtFreeDate
    debtFreeDate = amortizationRow["Month"];
    
    // Also get the Interest and sum it up.
    totalInterest += amortizationRow["InterestPaid"];
    
    // Add to the interest Array
    interestArr.push(totalInterest);
  }
  
  var totalMonthlyObj = {};
  totalMonthlyObj["DebtFreeDate"] = debtFreeDate;
  totalMonthlyObj["InterestAmount"] = totalInterest;
  totalMonthlyObj["InterestArray"] = interestArr;
  return totalMonthlyObj;
}

// Given a starting balance, a monthly loan payment, and the interest rate of
// a loan, this function returns the total amount of interest paid over the
// time of the loan.
function CalculateTotalInterest(startingBalance, monthlyPayment, interestRate) {
  var currentInterest = 0, newBalance = startingBalance, monthCount = 1;
  
  // JSON results object for displaying in a table
  var resultsObj = {};
  var totalInterest = 0;
  
  /*
    Results Object looks like this, contains various fields we'll need for
    calculating interest:
      ResultsObj: {
        ResultsObj: {
          Month1: {
            "Month": "March 2018"
            "StartingBalance": 1000, 
            "Repayment": 100, 
            "InterestPaid": 3.3333333333333335, 
            "PrincipalPaid": 96.66666666666667,
            "TotalInterestPaid": 3.3333333333333335,       
            "NewBalance": 903.3333333333334
          }
        }
        Month2: {
          ...
        }
        Month3: {
          ...
        }
      }
  */
  
  // Calculate Interest until the loan is paid off.
  while (newBalance > 0)
  {
    var singleResult = {};
    
    // Using datejs, url: http://www.datejs.com/
    // Can tweak this using standard DateTime formats: https://github.com/datejs/Datejs
    singleResult["Month"] = Date.today().add(monthCount).months().toString('MMMM yyyy');
    
    // "Starting Balance" is the old newBalance
    var startingBalance = newBalance;
    singleResult["StartingBalance"] = startingBalance;    
    
    // Monthly Payment edge case: if StartingBalance is less than monthlyPayment,
    // then startingBalance is all we will pay. Since we can't pay more than
    // the actual principal amount obviously.
    if (parseFloat(startingBalance) < parseFloat(monthlyPayment))
    {
      singleResult["Repayment"] = startingBalance;
    }
    else
    {
      singleResult["Repayment"] = monthlyPayment;
    }
    
    // Math taken from here
    // https://mozo.com.au/interest-rates/guides/calculate-interest-on-loan
    currentInterest = CalculateMonthlyInterest(startingBalance, interestRate);
    currentPrincipal = monthlyPayment - currentInterest;
    newBalance = newBalance - (monthlyPayment - currentInterest);
    
    singleResult["InterestPaid"] = currentInterest;
    singleResult["PrincipalPaid"] = currentPrincipal;
    
    // Sum up InterestPaid over time for the Min Vs Larger payment plot
    totalInterest += currentInterest; 
    singleResult["TotalInterestPaid"] = totalInterest;
    
    // New Balance edge case: can't be less than 0, if it's negative, make it 0.
    // This only happens on the last run through the loop.
    if (newBalance < 0)
    {
      singleResult["NewBalance"] = 0;
    }
    else
    {
      singleResult["NewBalance"] = newBalance;
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
