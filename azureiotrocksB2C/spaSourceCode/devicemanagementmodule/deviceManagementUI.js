'use strict';
const globalAppSettings = require("../globalAppSettings.js");
const msalHelper=require("../msalHelper")
const deviceManagementMainToolbar = require("./deviceManagementMainToolbar")
const modelEditorDialog = require("../sharedSourceFiles/modelEditorDialog")
const modelIoTSettingDialog= require("../sharedSourceFiles/modelIoTSettingDialog")
const modelManagerDialog = require("../sharedSourceFiles/modelManagerDialog")
const globalCache=require("../sharedSourceFiles/globalCache")
const twinsList=require("./twinsList")
const newTwinDialog=require("../sharedSourceFiles/newTwinDialog");

function deviceManagementUI() {
    this.twinsList= new twinsList($("#TwinsList"))
    deviceManagementMainToolbar.render()

    this.myMSALObj = new msal.PublicClientApplication(globalAppSettings.msalConfig);

    this.broadcastMessage()

    var theAccount=msalHelper.fetchAccount();
    if(theAccount==null && !globalAppSettings.isLocalTest) window.open(globalAppSettings.logoutRedirectUri,"_self")

    globalCache.loadUserData().then(re=>{
        if(globalCache.DBModelsArr.length==0){
            //TODO: if there is no model at all, prompt user to create his first model
        }else{
            this.twinsList.refill()
        }
    })
}

deviceManagementUI.prototype.broadcastMessage=function(source,msgPayload){
    var componentsArr=[modelManagerDialog,modelEditorDialog,deviceManagementMainToolbar,this.twinsList,newTwinDialog,modelIoTSettingDialog]

    if(source==null){
        for(var i=0;i<componentsArr.length;i++){
            var theComponent=componentsArr[i]
            this.assignBroadcastMessage(theComponent)
        }
    }else{
        for(var i=0;i<componentsArr.length;i++){
            var theComponent=componentsArr[i]
            if(theComponent.rxMessage && theComponent!=source) theComponent.rxMessage(msgPayload)
        }
    }
}
deviceManagementUI.prototype.assignBroadcastMessage=function(uiComponent){
    uiComponent.broadcastMessage=(msgObj)=>{this.broadcastMessage(uiComponent,msgObj)}
}


module.exports = new deviceManagementUI();