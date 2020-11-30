# Cloud-Based Unified Task List 
This repository contains code for Oracle Visual Builder (VBCS)-based web application that collects tasks from multiple applications for an enterprise and provides an unified view for users. 

Configuration options allow addition of SaaS applications and business process application on PaaS with minimal impact to code.

## **Background**

Enterprise applications provide task lists as a way to remind its users of pending actions or to notify them about changes. Oracle applications also provide tasks lists. There can be many such applications providing their own lists of tasks. Keeping track of such tasks in multiple applications can be tedious for users.
This extension web application helps users see a consolidated view of their tasks from multiple applications and act upon the tasks. Without an application like this, users would need to log into multiple enterprise applications to view tasks assigned to them, which can be unproductive. This web application can be deployed as a standalone application or embedded into other SaaS applications.  

## **Dependencies**

* This code requires Oracle Visual Builder Cloud Service (VBCS) 19.4.3 or later. 
* Access to one or more SaaS or PaaS products that expose their list of Tasks via  REST services.
* All REST services must support OAuth authorization.
* The VBCS Web application provided in the code requires that the various VBCS , SaaS and any PaaS application have their identiies federated. *
 
## **High Level Architecture**
![](https://orahub.oraclecorp.com/ateam/cloud.asset.fusion-unifiedtasklist/raw/master/highlevel.png)

See the diagram for interactions between participating applications, VBCS and Identity Cloud Service (IDCS).

This code requires that all participating enterprise applications are configured with SAML 2 federation, so that navigation between them and the unified tasklist is seamless. It also requires oAuth trust is established between applications and IDCS so that each application's API can recognize the current user. Each participating enterprise application must be able to provide a list of tasks over REST API and accept oAuth. Finally, each enterprise application must allow a direct GET request to its task details page when reference to a task is provided.

The main web page, upon initiation, determines the list of configured enterprise applications and accesses the REST endpoint for each application to fetch a list of tasks. These REST API requests are made with an oAuth token inserted by IDCS. This oAuth token asserts the identity of the currently logged-in user. Upon receiving the results, the web page then translates the fields into a list of fields displayed on the main page. The list of tasks is also updated upon translating results from each configured enterprise application's REST endpoint. The list of tasks stops updating when all the endpoints have been accessed, or when there is a failure with an endpoint. In case of a failure, an error message is displayed at the top of the page and subsequent processing of task list REST endpoints is stopped.

Each task on the list has a link to task page URL native to the enterprise application, with a reference to a task in query parameters. When user clicks on a task on the unified tasklist, the relevant task page is launched on new tab. The target task page loads using Federated SSO, gets the task reference from request and loads the task info.  User can perform any action supported by the native task page of the enterprise application. 

See sections below for instructions on how to use this code. Refer Oracle web site for VBCS, IDCS and fusion application documentation for more information about security configuration and REST API.

## ***Reference documentation for VBCS, IDCS and Fusion***
* https://docs.oracle.com/en/solutions/create-approval-process-digital-assets/enable-oracle-fusion-applications-cloud-service-federation-and-oauth-trust-oracle-identity-cloud-ser1.html
* https://blogs.oracle.com/vbcs/data-security-and-role-based-ui-in-vbcs-applications
* https://docs.oracle.com/en/cloud/saas/applications-common/19d/farca/index.html
* https://docs.oracle.com/en/cloud/paas/app-builder-cloud/visual-builder-developer/import-and-export-applications.html#GUID-845B8CD3-E196-4865-8F19-24F29B472B5D

## **High level steps to use the code**
* Clone the repository to your local hard drive
* Add the files and folders (exclude highlevel.png and .gitignore) to a .zip file named UnifiedTaskList_VBCS.zip
* Import the UnifiedTaskList_VBCS.zip as an application to your VBCS instance.
* Within VBCS add one or more SaaS or PaaS applications as task sources to configuration and update configuration as instructed in 'Sample configuration' section below.
* Add VBCS Service connection for each task source.
* Run the application to test.
* Deploy the application to production VBCS instance.


## **Sample Configuration**

A sample configuration snippet is provided below. This snippet must be modified and set to a VBCS page constant named constTaskSourceList under page unifiedtasklist, before testing the application.
This configuration is a JSON array of objects, with one configuration object for each task source, such as a saas application. Each field needs to be set as follows:

* `name`:The name that shows up on the list of tasks sources in the application.
* `epTaskListApi`: Refers to an endpoint inside service connection, to fetch list of tasks. Format is "ServiceConnectionName/Endpoint"
* `epTaskListApiAttributeMap`: A map to specify fields from payload returned by a task source for each attribute shown on the task list.
* `epTaskDetailUrl`: A direct URL for the task in the source application. This is essential for users to act on tasks in the displayed lsit of tasks.

```
[
    {
        "name": "Fusion",
        "epTaskListApi": "saaSBPMAPI/getTasks",
	    "epTaskListApiTasksRoot":"items",
        "epTaskListApiAttributeMap":{ 
		"Status":"state",
		"TaskID":"taskId",
		"Subject":"title",
		"DateAssigned":"assignedDate",
		"AssignedBy":"fromUserName"
	    },
	    "epTaskDetailUrl": "https://saasserver.oraclecloud.oracledemos.com/fscmUI/faces/adf.task-flow?taskId="
    },
    {
        "name": "OCI-Process",
        "epTaskListApi": "oICProcessBPMTasks/getTasks",
	    "epTaskListApiTasksRoot":"items",
        "epTaskListApiAttributeMap": { 
		"Status":"state",
		"TaskID":"number",
		"Subject":"title",
		"DateAssigned":"assignedDate",
		"AssignedBy":"fromUserName"
	},
	    "epTaskDetailUrl": "/ic/pub/components/pages/taskdetail.html?taskNumber="
    }
]
```

## **Embedding application into SaaS**

This application can be embedded into any other application that supports HTML IFRAME. 

In fusion application, page composer can be used to embed the page.  Here are the instructions for HCM Cloud.

* Log into Oracle HCM cloud, opening SaaS URL on a Chrome or Firefox browser window, using link and credentials provided at the starts of this lab.
* Enter sandbox. In order to add new web pages, enter a sandbox.
  * Navigate to “Configuration->Sandboxes” from Fusion application menu on the left.
  * Enter sandbox by clicking the arrow on the right
* Create a web application in Fusion under “Create Third Party Application” page. Refer to documentation provided in reference section below..
  * Set the URL for 3rd party application to root folder of live VBCS applications. For example, https://*VBCS host*/ic/builder/rt/
* Create a new web page using Page Integration. Page integrator tool allows creating new pages to HCM Cloud. 
  * Navigate to "Page Integration" under "Configuration" section of the navigation menu in HCM cloud.  Click "New Page" 
  * Create a new page, with information as shown below. Name the page after your name to avoid conflict with other attendees. 
    * Set name to a suitable value
    * Select an Icon
    * Set Application Role to “Employee”, so all employees can see the page
       * Click the key icon next to “Web page” and set values as shown below
         * For “Web application”, select a web application that points to hostname and root folder of VBCS applications.
         * For “Destination for Web Application”, for example, enter “/*UnifiedTaskListVBCSAppName*/live/webApps/webapp/”. Replace *UnifiedTaskListVBCSAppName* with the value entered while importing VBCS application.
         * For “Secure Token Name” , enter “jwtToken”. This is the token name VBCS application expects.
         * Click “Save and Close”
    * Click “Save and Close” again to create the new page.
* Now that the new web page is created, move it to the right place in Structure so you can easily access it.
    * Navigate to “Configuration->Structure” from main menu.
    * In the “Navigation Configuration” page, search for the new page as shown.    
    * Click on “View Hierarchy” icon to bring the new page up on the list on the left.
    * Click on row of the new page on the left side (on blank area, not on page link) and then  click on “>” to move the page. A menu of groups appears. Select “Me”.
    * Now, go back to Navigation menu and confirm that the page appears under “Navigation->Me”.  If does not, refresh the page and check again.
    * Click on the new page, to see it action. The page might be cropped in the bottom. From menu on the top right by clicking on user name and clicking on “Edit Pages”.   Resize the page control as shown below and click on “Close” on top right.
* Once the page is embedded in SaaS, application will retrieve tasks from the configured task source applications, for currently longged-in SaaS user. 

## ***Reference documentation for embedding application into SaaS***
* https://blogs.oracle.com/saaspaas/integrating-partner-apps-page-integration
* https://docs.oracle.com/en/cloud/paas/content-cloud/developer/embed-vbcs-page-site-page.html

## **Change the application for embedded or standalone use**

You can switch the root page of the web application to make it suitable for standalone use. When the application is embedded, it is protected by the security of the application that hosts the iFrame. In a standalone scenario, the application is protected by IDCS, so user will be directed to IDCS login page for a successful login before the page is loaded.

There are two root pages in the application. A page named *shell* that's transparent and allows seamless embedding of the page with other web applications, HCM cloud for example. Another page named *Main* has a header and footer for standalone use of the application. To change the page, go to settings page of the *webapp* and under *General settings*, select a page under *Default page* drop down. 

## **Contributing**

See [CONTRIBUTIUNG](CONTRIBUTING.md) for details. 

## **Get help**

Visit Oracle Cloud Customer Connect Community at https://cloudcustomerconnect.oracle.com for additional resources and FAQs. 

## **License**
Copyright (c) 2014, 2020, Oracle and/or its affiliates. All rights reserved.

The code in this repository is licensed under the Universal Permissive License 1.0. See the [LICENSE](LICENSE.txt)) for details.