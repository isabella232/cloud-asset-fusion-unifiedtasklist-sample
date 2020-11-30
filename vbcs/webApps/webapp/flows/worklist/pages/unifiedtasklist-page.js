/*
Copyright (c) 2014, 2020, Oracle and/or its affiliates.
Licensed under The Universal Permissive License (UPL), Version 1.0
as shown at https://oss.oracle.com/licenses/upl/
*/
define(['vb/helpers/rest'], function(RestHelper) {
  'use strict';

  var PageModule = function PageModule() {};

  /* 
   * Function:loadTaskList , a page module
   * 
   * Description:From the provided list of task sources, fined the endpoints and make REST calls.
   * From each REST response, store select attributes from the list of tasks.
   * Return the stored attributes to the caller.
   * If there are errors getting tasks from a source, skip that source and display and error message
   * 
   * Input:constant object array, with one object per source system
   * Output:Object with any error message and list of tasks with attributes.
   * 
   */
  PageModule.prototype.loadTaskList = async function(objTaskSourceList,
    strSelectedTaskSource) {

    //How many task sources?
    var countTaskSources = objTaskSourceList.length;
    //Defined array of objects to hold tasks.

    var objReturn = new Object();
    objReturn.retStatus = 0;
    objReturn.retMessage = null;
    objReturn.retObject = undefined;

    var objTaskList = [];
    try {


      //For each task soruce defined, get a list of of tasks
      for (var currTaskSource = 0; currTaskSource < countTaskSources; currTaskSource++) {

        if (strSelectedTaskSource == "All" || ((strSelectedTaskSource !=
            "All") && (strSelectedTaskSource == objTaskSourceList[
            currTaskSource].name))) {
          await fetchTasksFromSource(objTaskSourceList[currTaskSource]).then(
            result => {
              if (result.retStatus != 0) {
                objReturn.retStatus = -1;
                objReturn.retMessage =
                  "Error getting tasks from source:" +
                  objTaskSourceList[currTaskSource].name + ". Message:" +
                  result.retMessage;
                objReturn.retObject = undefined;
                return objReturn;
              }
              for (var currResult = 0; currResult < result.retObject.length; currResult++)
                objTaskList.push(result.retObject[currResult]);
            }
          );
        }

      }
      objReturn.retObject = objTaskList;

    } catch (error) {
      objReturn.retStatus = -1;
      objReturn.retMessage = "Error getting tasks" + ". Message:" + error;
      objReturn.retObject = undefined;

    }


    return objReturn;
  }


  /* 
   * Function:populateTaskSourceDropDown, a page module
   * 
   * Description:From the provided list of task sources, return objects option/values for dropdown.
   * 
   * Input:constant object array, with one object per source system
   * Output:Object with any error message and list of tasks with attributes.
   * 
   */
  PageModule.prototype.populateTaskSourceDropDown = function(
    objTaskSourceList) {

    var objReturn = new Object();
    objReturn.retStatus = 0;
    objReturn.retMessage = null;
    objReturn.retObject = undefined;

    var objSourceNameList = [];
    try {
      //How many task sources?
      var countTaskSources = objTaskSourceList.length;
      //Defined array of objects to hold tasks.
      objSourceNameList.push({
        "option": "All",
        "value": "All"
      });
      //For each task soruce defined, get a list of of tasks
      for (var currTaskSource = 0; currTaskSource < countTaskSources; currTaskSource++) {
        objSourceNameList.push({
          "option": objTaskSourceList[currTaskSource].name,
          "value": objTaskSourceList[currTaskSource].name
        });
      }
      objReturn.retObject = objSourceNameList;
    } catch (error) {
      objReturn.retStatus = -1;
      objReturn.retMessage = "Error getting tasks" + ". Message:" + error;
      objReturn.retObject = undefined;
      return objReturn;
    }
    return objReturn;
  }


  /* 
   * Function:fetchTasksFromSource, an internal function accessible only within this javascript file.
   * 
   * Description:For the tasksource object provided as input, fetch a list of tasks and return to the caller.
   * If there is an error, return null to caller.
   * 
   * The supplied task source must already hava service connection defined in VBCS, along with relevant credentails.
   *
   * Input:A task source definition object. The attributes provide values such as endpoints.
   * Output:List of tasks obtained from task source.
   * 
   */
  async function fetchTasksFromSource(objTaskSource) {

    var objReturn = new Object();
    objReturn.retStatus = 0;
    objReturn.retMessage = null;
    objReturn.retObject = undefined;

    self.endpointAddress = objTaskSource.epTaskListApi;
    var ep = RestHelper.get(self.endpointAddress);

    var objTasks;
    try {

      ep.responseBodyFormat('json');
      await ep.fetch()
        .then(result => {
          objTasks = result.body;
        })
        .catch(error => {
          objReturn.retStatus = -1;
          objReturn.retMessage = error;
          return objReturn;
        });

      //Format objects to a format acceptable to Array data provider. 
      //Use the attribute mapping in the task source.
      objReturn.retObject = [];



      if (objTasks != null) {
        //loop through tasks and exatrct attributes
        var countTasks = objTasks.items.length;
        for (var currTask = 0; currTask < countTasks; currTask++) {
          objReturn.retObject[currTask] = new Object;
          objReturn.retObject[currTask].Status = eval(
            'objTasks.items[currTask].' + objTaskSource.epTaskListApiAttributeMap
            .Status);
          objReturn.retObject[currTask].TaskID = eval(
            'objTasks.items[currTask].' + objTaskSource.epTaskListApiAttributeMap
            .TaskID);
          objReturn.retObject[currTask].Subject = eval(
            'objTasks.items[currTask].' + objTaskSource.epTaskListApiAttributeMap
            .Subject);
          objReturn.retObject[currTask].DateAssigned = eval(
            'objTasks.items[currTask].' + objTaskSource.epTaskListApiAttributeMap
            .DateAssigned);
          objReturn.retObject[currTask].AssignedBy = eval(
            'objTasks.items[currTask].' + objTaskSource.epTaskListApiAttributeMap
            .AssignedBy);
          objReturn.retObject[currTask].Source = objTaskSource.name;
        }
      }

    } catch (error) {
      objReturn.retStatus = -1;
      objReturn.retMessage = error;
      objReturn.undefined;
      return objReturn;
    }

    return objReturn;
  }

  /* 
   * Function:getTaskDetailURL, a page module
   * 
   * Description:For the selected by user, determine the URL to be opened and return it as a string to caller.
   * If there is an error, return null to caller.
   * 
   * Input:A task object, selected by user.
   * Output:URL to be opened
   * 
   */
  PageModule.prototype.getTaskDetailURL = function(objTask,
    objTaskSourceList) {

    var objReturn = new Object();
    objReturn.retStatus = 0;
    objReturn.retMessage = null;
    objReturn.retObject = undefined;

    var varURL;
    var currTaskSource = 0

    try {

      while (objTask.Source != objTaskSourceList[currTaskSource].name)
        currTaskSource++;

      if (objTaskSourceList[currTaskSource].epTaskDetailUrl == null ||
        objTaskSourceList[currTaskSource].epTaskDetailUrl == undefined)
        throw ("Task Detail URL is not specified for " +
          objTaskSourceList[currTaskSource].name)

      varURL = objTaskSourceList[currTaskSource].epTaskDetailUrl +
        objTask.TaskID;
      objReturn.retObject = varURL;
    } catch (error) {
      objReturn.retStatus = -1;
      objReturn.retMessage = error;
      objReturn.undefined;
      return objReturn;
    }

    return objReturn;
  }

  return PageModule;
});