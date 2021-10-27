# tools-jira-reporting
A reporting tool for extracting information out of Jira.

Setup
Download repo
npm installnpm audit fix

node index.js --help


node index.js user-ticket-history-table  \
--host clicksend.atlassian.net \
--basic <basic auth hash>== \
--dir ./ \
--startDate 2021-01-01 \
reports --user michael 

--basic is the Base64 encoded username:password
Where 
username is your login email address and
password is the token you generated in Jira to use here 
Link to token generator : https://id.atlassian.com/manage-profile/security/api-tokens




