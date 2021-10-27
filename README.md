
# tools-jira-reporting

**A reporting tool for extracting information out of Jira.**
  
## Setup

 1. Download repo
 2. Execute the following:

    npm install
    
    node index.js --help
    
    --host \<your  company  name>.atlassian.net \\
    --username \<your username> \\
    --password \<your password> \\
    --dir ./reports \\
    --startDate 2021-01-01 \\
    --user \<some user name on whom to report>
    
Where
* username is your login email address and
* password is the token you generated in Jira to use here

[Link to the Atlassian token generator](https://id.atlassian.com/manage-profile/security/api-tokens)