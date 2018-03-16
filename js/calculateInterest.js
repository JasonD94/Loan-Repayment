/*
    File: calculateInterest.js
    Jason Downing
    Contact: jason [AT] downing [DOT] io
    MIT Licensed - see http://opensource.org/licenses/MIT for details.
    Anyone may freely use this code. Just don't sue me if it breaks stuff.
    Created: 2/22/2018

    This JS file contains loan interest calculation functions
*/

// Array of Objects to hold all of our loan data
// This would look something like:
/*
    _Loans [
      {
        LoanName: Loan1
        CurrentBalance: $1000
        MinimumPayment: $100
        InterestRate: 4.85
      }
      {
        LoanName: Loan2
        CurrentBalance: $2000
        MinimumPayment: $250
        InterestRate: 9.05
      }
      etc
    ]
*/
// This will be handled for us in VueJS, using a custom compoment of inputs,
// and setting up some Data/Methods to control adding, removing, and inputing
// loan data for however many loans the user adds.
var vm = new Vue({
  el: "#loanInputs",
  data: {
    loans: [],
    isHover: false,
    largerPayment: null
  },
  computed: {
    totalBalance: function() {
      var total = 0;
      // Loop over all the balances
      for (var x = 0; x < this.loans.length; x++)
      {
        total += parseInt(this.loans[x].balance);
      }
      
      // Check for NaN (blank input)
      if (isNaN(total))
      {
        return 0;
      }
      
      return total;
    },
    totalPayments: function() {
      var total = 0;
      // Loop over all the monthly payments
      for (var x = 0; x < this.loans.length; x++)
      {
        total += parseInt(this.loans[x].minimumPayment);
      }
      
      // Check for NaN (blank input)
      if (isNaN(total))
      {
        return 0;
      }
      
      return total;
    },
    avgInterestRate: function() {
      var total = 0;
      // Loop over all the monthly payments
      for (var x = 0; x < this.loans.length; x++)
      {
        total += parseFloat(this.loans[x].interestRate);
      }
      
      // Check for NaN (blank input)
      if (isNaN(total))
      {
        return 0;
      }
      else if (isNaN(total / this.loans.length))
      {
        return 0;
      }
      
      // Return the Average Interest Rate across all loans
      return total / this.loans.length;
    }
  },
  methods: {
    addLoan: function() {
      var elem = document.createElement('div');
      this.loans.push({
        name: "Loan " + (this.loans.length + 1),
        balance: "",
        minimumPayment: "",
        interestRate: ""
      });
    },
    removeLoan: function(index) {
      this.loans.splice(index, 1);
    },
    calculateInterest: function(event, row) {
      OnCalculate();
    },
    largerPaymentInfo: function() {
      // Pop up an info alert
      TotalMonthlyPaymentInformation();
    }
  }
});

// Wrapping the click listener in a ready so that the DOM will be all loaded
// when this fires up.
$(document).ready(function () {
  
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
      title: "What is this field?",
      html: "This is a monthly payment that is greater than the minimum payment \
      that you would like to compare against. <br> For example, if your minimum \
      payment was $100, you could enter $200 in this field to see how much \
      quicker you'd pay off the loan, and how much money you would save.",
      type: "question"
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
      type: "error",
      html: "This payment plan looks to be unreasonable. I tried calculating interest \
      on this debt up to the <b>year 2100</b>, and I was unable to pay off the loan. <br> \
      You need to increase the monthly amount you are paying on the loan if at all possible. \
      Other  options include: <br> \
      - adjusting your repayment plan <br> \
      - seeking forgiveness on the loan <br> \
      - contributing more per month whenever possible."
    });
    
    return;
  }
  // Check for missing input, so we don't display a blank plotly graph!
  else if ( parseFloat(amortizationTable) == -2 )
  {
    return;
  }
  // User hasn't added a loan, because loanData is empty!
  else if ( parseFloat(amortizationTable) == -3 )
  {
    swal({
      type: "error",
      html: "It looks like you haven't added a loan yet! Click the Add Loan button first please :)"
    });
    
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
  
  // Bomb out if the user hasn't added any loans yet.
  if ( vm._data.loans.length == 0 )
  {
    return -3;
  }
  
  // Make a copy of the Loan Data without bindings to the user input, so we 
  // do not mess up the ability to add/remove loans!
  var loanData = [];
  
  // Could have more than one loan, so check all inputs and make sure they exist.
  for (var x = 0; x < vm._data.loans.length; x++) {
    var currLoan = vm._data.loans[x];   // Current Loan Object to check properties on.
    var index = x + 1;
    
    // Empty checks
    if (!currLoan.name)
    {
      // For Sweet Alerts Docs: https://sweetalert2.github.io/
      swal({
        type: "warning",
        text: "Looks like you forgot to include a Name for Loan " + index + " 😢"
      });
      
      return -2;
    }
    if (!currLoan.balance)
    {
      // For Sweet Alerts Docs: https://sweetalert2.github.io/
      swal({
        type: "warning",
        text: "Looks like you forgot to include a Starting Balance for Loan " + index + " 😢"
      });
      
      return -2;
    }
    if (!currLoan.minimumPayment)
    {
      swal({
        type: "warning",
        text: "Looks like you forgot to include a Monthly Payment for Loan " + index + " 😢"
      });
      
      return -2;
    }
    if (!currLoan.interestRate)
    {
      swal({
        type: "warning",
        text: "Looks like you forgot to include an Interest Rate for Loan " + index + "😢"
      });
      
      return -2;
    }
    
    // Make a copy of the object, using this stackoverflow post and this github issue
    // as a resource for figuring out how to do this.
    // https://stackoverflow.com/questions/30578254/
    // https://github.com/vuejs/vue/issues/158
    loanData.push(Vue.util.extend({}, currLoan))
  }
  
  if (parseFloat(vm.largerPayment) < parseFloat(vm.totalPayments))
  {
    // For Sweet Alerts Docs: https://sweetalert.js.org/docs/
    swal({
      type: "error",
      text: "Total Monthly Payment cannot be less than Monthly Payment"
    });
    
    return -2;
  }
  
  // Calculate the standard amortization (hardcoded to Avalanche for now!)
  // Also hard coded not to look at larger monthly payment too
  var amortizationTable = CalculateInterestByLoan(loanData, 1, 0);
  
  // If the user provided a Total Monthly Payment, calculate the amortization for that amount too.
  // But, pull out the Debt Free Date and Interest amount, since we just want those for comparision.
  /*
  if (parseFloat(vm.largerPayment) > 0)
  {
    var additionalMonthlyCalculation = CalculateAdditionalMonthlyPayment(startingBalance, totalMonthlyPayment, interestRate);
    amortizationTable["AdditionalMonthlyCalculation"] = additionalMonthlyCalculation;
  }
  */
  
  return amortizationTable;
}

// Calculates interest for multiple loans by sorting based on either lowest Interest Rate
// or lowest Total Balance.
function CalculateInterestByLoan(loanData, loanMethod, useLargerPayment) {

  // Two ways we want to calculate interest/loan amortization on:
  // Avalanche - paying off the highest interest rates first, which pays them off the
  //             quickest overall and saves the most on interest
  // Snowball - paying off smallest balances first, to encourage yourself (psychologically)
  //            to continue paying off the loans  
  
  // We shall support both methods, and sort the array for paying off based on
  // loanMethod being 1 (avalanche) or 2 (snowball)
  
  // Avalanche method - descending order interest rate
  if (loanMethod == 1)
  {
    loanData.sort(function(a, b) {
      return b.interestRate - a.interestRate;
    });
  }
  // Snowball method - ascending order balance
  else if (loanMethod == 2)
  {
    loanData.sort(function(a, b) {
      return a.balance - b.balance;
    });
  }
  
  // JSON results object for displaying in a table
  var resultsObj = {};
  var totalMinPayments = 0;   // For loans that get paid off, track their min payment sum
  var totalInterestPaid = 0;  // Track the total interest paid across all loans
  var monthCount = 1;
  
  // Keeping track of the total balance of all loans
  var totalBalance = loanData.map(balance).reduce(balanceTotal);
  
  // Loop through and pay each loan by month. Once a loan is paid off, apply
  // it's minimum payment to the next loan in the list (sorted based on loanMethod above)
  while (loanData.length > 0) 
  {
    // Total Result for all loans (sum of loans 1, 2, 3 etc single monthly payment)
    var totalResult = {};
    totalResult["InterestPaid"] = 0;    // Reset every loop
    totalResult["PrincipalPaid"] = 0;   
    totalResult["Repayment"] = 0;
    
    // Using datejs, url: http://www.datejs.com/
    // Can tweak this using standard DateTime formats: https://github.com/datejs/Datejs
    totalResult["Month"] = Date.today().add(monthCount).months().toString('MMMM yyyy');
    
    // "Starting Balance" is the beginning balance before we apply the payment
    totalResult["StartingBalance"] = totalBalance;
    
    var loanPayment = 0;
    
    for(var i = 0; i < loanData.length; i++)
    {
      // Pay a month toward the current loan
      /*
          
          if we have two loans, like:
          0: {name: "Loan 2", balance: "1000", minimumPayment: "100", interestRate: "9.99"}
          1: {name: "Loan 1", balance: "25000", minimumPayment: "450", interestRate: "4.99"}
        
          Then we have:
          totalInterest = 0;
          totalMinPayments = 0
          largerPayment = (ignoring this for now)
          totalBalance = 26000
      
          So month 1, we pay the min payment on loan2, and the min payment on loan1.
          Same for future months until loan2 is paid off.
          Then we start paying 550 a month (adding loan2's min payment) toward loan1.
      */
      
      // Need to apply additional minimum payments / the larger payment (if it exists)
      // to the first loan in the array. This would be either the lowest interest loan
      // or the lowest balance loan depending on repayment method selected.
      if (i == 0 && totalMinPayments > 0)
      {
        loanPayment = parseFloat(loanData[i].minimumPayment) + totalMinPayments;
      }
      else
      {
        loanPayment = parseFloat(loanData[i].minimumPayment);
      }
      
      // TODO: Also check LargerPayment and apply it too.
      
      // Calculate One month's payment for the current loan
      var currentLoanPayment = OneMonthlyPayment(loanData[i].balance, loanPayment, loanData[i].interestRate);
      
      // Sum up the current Repayment / InterestPaid / PrincipalPaid
      totalResult["Repayment"] += currentLoanPayment["Repayment"];
      totalResult["InterestPaid"] += currentLoanPayment["InterestPaid"];
      totalResult["PrincipalPaid"] += currentLoanPayment["PrincipalPaid"];
      
      // Sum up InterestPaid
      totalInterestPaid += currentLoanPayment["InterestPaid"];
      
      // Remove the PrincipalPaid from this loan's balance.
      loanData[i].balance -= currentLoanPayment["PrincipalPaid"];
      
      // Also remove it from the TotalBalance tracker
      totalBalance -= currentLoanPayment["PrincipalPaid"];
      
      // Check to see if the loan's new balance is 0. If so, remove it.
      if (currentLoanPayment["NewBalance"] <= 0)
      {
        // Make sure to add this loan's minimum payment to our "totalMinPayments"
        // tracker, so it's minimum payment can be applied to the next loan!
        totalMinPayments += loanData[i].minimumPayment;
        loanData.splice(i, 1);
      }
    }
    
    // Add results for TotalInterestPaid and New Balance
    totalResult["TotalInterestPaid"] = totalInterestPaid;
    totalResult["NewBalance"] = totalBalance;
    
    // Add a row into the results object
    resultsObj["Month" + monthCount] = totalResult;
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

// Functions for the Map Reduce call to sum up all the loan balances
function balance(loan) {
  return parseFloat( loan.balance );
}
function balanceTotal(total, num) {
  return total + num;
}

// Given a starting balance, a monthly loan payment, and the interest rate of
// a loan, this function returns the total amount of interest paid over the
// time of the loan.
function OneMonthlyPayment(startingBalance, monthlyPayment, interestRate) {

  var singleResult = {};
  
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
  var currentInterest = CalculateMonthlyInterest(startingBalance, interestRate);
  var currentPrincipal = monthlyPayment - currentInterest;
  var newBalance = startingBalance - (monthlyPayment - currentInterest);
  
  singleResult["InterestPaid"] = currentInterest;
  singleResult["PrincipalPaid"] = currentPrincipal;
  
  // New Balance edge case: can't be less than 0, if it's negative, make it 0.
  // Also can't have PrincipalPaid be larger than the startingBalance either!
  // This only happens on the last run through the loop.
  if (newBalance < 0)
  {
    singleResult["PrincipalPaid"] = startingBalance;
    singleResult["NewBalance"] = 0;
  }
  else
  {
    singleResult["NewBalance"] = newBalance;
  }
  
  return singleResult;
}

// Calculates one month of interest
function CalculateMonthlyInterest(currentBalance, interestRate) {
  // Convert InterestRate to a percent
  interestRate = interestRate / 100;
  
  // Interest = (interest rate / 12 payments per year) * loan principal
  return ( (interestRate / 12) * currentBalance );
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