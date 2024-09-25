// Define constants for sheet names and spreadsheet ID
const SPREADSHEET_ID = '*****************';  // Replace with your actual Spreadsheet ID
const SHEET_USERS = 'Users';   // Name of the Users sheet
const SHEET_QUESTIONS = 'Questions';  // Name of the Questions sheet

// Define the login window start and end times
const LOGIN_START = new Date('2024-09-08T08:00:00');  // Replace with actual start date and time
const LOGIN_END = new Date('2024-09-30T01:30:00');    // Replace with actual end date and time

// Function to serve the HTML login page
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Login Page')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doLogin(teamID, contactNumber) {
  const currentTime = new Date();
  
  if (currentTime < LOGIN_START || currentTime > LOGIN_END) {
    return { success: false, message: 'Login not allowed at this time.' };
  }
  
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_USERS);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === teamID && data[i][3] === contactNumber) {
      // Check if the user has already attempted questions
      if (data[i][4] && data[i][4].trim() !== '') {
        return { success: false, message: 'You have already attempted questions. Further login is not allowed.' };
      }
      return {
        success: true,
        teamID: data[i][0],
        teamName: data[i][1],
        teamLeader: data[i][2],
        email: data[i][5]  // Assuming Email ID is in column F (index 5)
      };
    }
  }
  
  return { success: false, message: 'Invalid credentials.' };
}

function getQuestions(teamID) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_QUESTIONS);
  const data = sheet.getDataRange().getValues();
  
  const questions = [];
  
  for (let i = 1; i < data.length; i++) {  // Starting at 1 to skip headers
    const questionID = data[i][0];  // Question ID is in column A (index 0)
    const questionText = data[i][2];  // Question is in column C (index 2)
    const attemptedBy = data[i][4] ? data[i][4].split(',') : [];  // Assuming Attempted By is in column E (index 4)
    
    questions.push({
      questionID: questionID,
      question: questionText,
      attemptedBy: attemptedBy.includes(teamID)
    });
  }
  
  return questions;
}

function updateAttemptedQuestion(teamID, questionIDs, email) {
  const userSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_USERS);
  const userData = userSheet.getDataRange().getValues();
  
  for (let i = 1; i < userData.length; i++) {
    if (userData[i][0] === teamID) {
      const attemptedQuestions = userData[i][4] ? userData[i][4].toString() : '';
      
      if (attemptedQuestions !== '') {
        return { success: false, message: 'You have already attempted questions.' };
      }
      
      // Save the questionIDs to the Users sheet
      userSheet.getRange(i + 1, 5).setValue(questionIDs);
      
      // Get the link for the saved Question ID
      const questionSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_QUESTIONS);
      const questionData = questionSheet.getDataRange().getValues();
      
      let link = '';
      
      for (let j = 1; j < questionData.length; j++) {
        if (questionData[j][0].toString() === questionIDs) {
          link = questionData[j][1];  // Link is in column B (index 1)
          break;
        }
      }
      
      if (!link) {
        return { success: false, message: 'Question link not found for ID: ' + questionIDs };
      }
      
      // Send email with the link
      try {
        MailApp.sendEmail({
          to: email,
          subject: "Your Question Link",
          body: "Here is the link to your selected questions: " + link
        });
        return { success: true, message: 'Link sent to your email successfully.' };
      } catch (error) {
        return { success: false, message: 'Failed to send email. Error: ' + error.toString() };
      }
    }
  }
  
  return { success: false, message: 'Team not found.' };
}

// Logout function
function doLogout() {
  return { success: true };
}
