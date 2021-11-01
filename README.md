
# tools-jira-reporting

**A reporting tool for extracting information out of Jira.**
  
## Setup

 1. Clone this repo
 2. From the repo directory, execute the following:

    npm install
    node index.js --help
    
    node index.js user-ticket-history-table  \
    --host $JIRA_HOST \
    --username $JIRA_USER \
    --password $JIRA_TOKEN \
    --dir ./reports \
    --startDate 2021-01-01 \
    --user $A_JIRA_USERNAME \
    
Where
* username is your login email address and
* password is the token you generated in Jira to use here
* user is a Jira user name or a fragment of a user name.  If what you provided matches more than one user, this tool will report an error.

[Link to the Atlassian token generator](https://id.atlassian.com/manage-profile/security/api-tokens)

## Available Reports
Currently there are two reports available:
### ticket-history-chart
> Generate a chart that shows the different statuses of a ticket over time.
### user-ticket-history-table
> Report that generates a list of tickets to which a user was assigned over a time period.