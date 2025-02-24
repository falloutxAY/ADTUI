const express = require("express");
const got = require('got');

function routerDeviceManagement(){
    this.router = express.Router();
    this.useRoute("changeModelIoTSettings","isPost")
    this.useRoute("provisionIoTDeviceTwin","isPost")
    this.useRoute("deprovisionIoTDeviceTwin","isPost")
}

routerDeviceManagement.prototype.useRoute=function(routeStr,isPost){
    this.router[(isPost)?"post":"get"]("/"+routeStr,(req,res)=>{
        this[routeStr](req,res)
    })
}

routerDeviceManagement.prototype.provisionIoTDeviceTwin = async function(req,res){
    
}

routerDeviceManagement.prototype.deprovisionIoTDeviceTwin = async function(req,res){
    
}

routerDeviceManagement.prototype._provisionIoTDeviceTwin = async function(twinID){
    
}

routerDeviceManagement.prototype._deprovisionIoTDeviceTwin = async function(twinID){
    
}


routerDeviceManagement.prototype.changeModelIoTSettings = async function(req,res){
    var postLoad=req.body;
    postLoad.account=req.authInfo.account
    
    try{
        var {body} = await got.post(process.env.dboperationAPIURL+"insertData/updateModel", {json:postLoad,responseType: 'json'});
        res.send(body);
    }catch(e){
        res.status(e.response.statusCode).send(e.response.body);
        return;
    }

    var updatedModelDoc=body.updatedModelDoc;
    var twins= body.twins //[{id:..,IoTDeviceID:...}...]
    var returnDBTwins=[]
    
    if(updatedModelDoc.isIoTDeviceModel){
        //provision each device to iot hub
        twins.forEach(aTwin => {
            var iotTwinID= aTwin.IoTDeviceID
            if(iotTwinID!=null && iotTwinID!="") {
                return; //the twin has been provisioned to iot hub
            }
            var twinID= aTwin.id;
            var provisionedTwinDoc = this._provisionIoTDeviceTwin(twinID,)
            returnDBTwins.push(provisionedTwinDoc)
        });
    }else{
        //deprovision each device off iot hub
        twins.forEach(aTwin => {
            var iotTwinID= aTwin.IoTDeviceID
            if(iotTwinID==null || iotTwinID=="") {
                return; //the twin has been deprovisioned off iot hub
            }
            var twinID= aTwin.id;
            var deprovisionedTwinDoc = this._deprovisionIoTDeviceTwin(twinID)
            returnDBTwins.push(deprovisionedTwinDoc)
        });
    }

    res.send({"updatedModelDoc":updatedModelDoc,"DBTwins":returnDBTwins})
    
    /*TODO: provision iot hub device if the model is an IoT device model
    if(req.body.isIoTDevice){
        var tags={
            "app":"azureiotrocks",
            "twinName":originTwinID,
            "owner":req.authInfo.account,
            "modelID":twinInfo["$metadata"]["$model"]
        }
        var desiredInDeviceTwin= req.body.desiredInDeviceTwin
        try{
            var provisionDevicePayload={"deviceID":twinUUID,"tags":tags,"desiredProperties":desiredInDeviceTwin}
            await got.post(process.env.iothuboperationAPIURL+"controlPlane/provisionDevice", {json:provisionDevicePayload,responseType: 'json'});
            haveIoTDetail=true;
        }catch(e){
            console.error("IoT device provisioning fails: "+ twinUUID)
        }
    }
    */
}


module.exports = new routerDeviceManagement().router