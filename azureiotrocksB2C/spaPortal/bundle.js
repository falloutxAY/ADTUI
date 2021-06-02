(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const signupsigninname="B2C_1_singupsignin_spaapp1"
const b2cTenantName="azureiotb2c"

const url = new URL(window.location.href);

var strArr=window.location.href.split("?")
var isLocalTest=(strArr.indexOf("test=1")!=-1)

const globalAppSettings={
    "b2cSignUpSignInName": signupsigninname,
    "b2cScopes":["https://"+b2cTenantName+".onmicrosoft.com/taskmastermodule/operation"],
    "logoutRedirectUri": url.origin+"/spaindex.html",
    "msalConfig":{
        auth: {
            clientId: "f4693be5-601b-4d0e-9208-c35d9ad62387",
            authority: "https://"+b2cTenantName+".b2clogin.com/"+b2cTenantName+".onmicrosoft.com/"+signupsigninname,
            knownAuthorities: [b2cTenantName+".b2clogin.com"],
            redirectUri: window.location.href
        },
        cache: {
            cacheLocation: "sessionStorage", 
            storeAuthStateInCookie: false
        },
        system: {
            loggerOptions: {
                loggerCallback: (level, message, containsPii) => {}
            }
        }
    },
    "isLocalTest":isLocalTest,
    "taskMasterAPIURI":((isLocalTest)?"http://localhost:5000/":"https://azureiotrockstaskmastermodule.azurewebsites.net/")
}

module.exports = globalAppSettings;
},{}],2:[function(require,module,exports){
//the Start page is the sign in page
const globalAppSettings=require("./globalAppSettings")
const msalHelper=require("./msalHelper")

function mainUI() {
    this.myMSALObj = new msal.PublicClientApplication(globalAppSettings.msalConfig);
    $('#signInBtn').on("click",async ()=>{
        var theAccount=await msalHelper.signIn()
        if(theAccount!=null) this.afterSignedIn(theAccount);
    })
    //in case of page refresh and it might be ok to fetch account directly from cache
    var theAccount=msalHelper.fetchAccount(); 
    if(theAccount!=null) this.afterSignedIn(theAccount,"noAnimation")
}

mainUI.prototype.afterSignedIn=function(anAccount,noAnimation){
    if(noAnimation){
        $('#headerPart').css({height:"100vh","padding":"15px"})
        this.showModuleButtons()
    }else{
        $('#headerPart').animate({height:"100vh"})
        $('#githublink').animate({opacity:"0"})
        $('#signInBtn').animate({opacity:"0"})
        $('#footerPart').animate({opacity:"0"},()=>{this.showModuleButtons()})
        $('#headerPart').animate({"padding":"15px"})
    }
}

mainUI.prototype.showModuleButtons=function(){
    $('#githublink').remove()
    $('#signInBtn').remove()
    $('#descriptionPart').remove()
    $('#footerPart').remove()

    //$('#headerPart').empty()
    var deviceManageBtn=$('<button class="w3-button w3-hover-amber w3-ripple w3-card w3-padding-16 w3-margin-bottom" style="width:550px;display:block">Device Management</button>')
    var adtUIBtn=$('<button class="w3-button w3-hover-amber w3-ripple w3-card w3-padding-16 w3-margin-bottom" style="width:550px;display:block">Digital Twin</button>')
    var eventLogBtn=$('<button class="w3-button w3-hover-amber w3-ripple w3-card w3-padding-16 w3-margin-bottom" style="width:550px;display:block">Event Log</button>')
    var logoutBtn=$('<button class="w3-button w3-black w3-ripple w3-card w3-padding-16 w3-margin-bottom" style="width:350px;display:block;margin-left:100px;margin-top:32px">Sign Out</button>')
    
    $('#headerPart').append($('<div style="width:50%" class="w3-container  w3-cell "></div><div id="middleDIV" class="w3-container w3-cell w3-cell-middle" style="height:50vh"></div><div style="width:50%" class="w3-container w3-cell">'))
    $('#middleDIV').append(deviceManageBtn,adtUIBtn,eventLogBtn,logoutBtn) 

    logoutBtn.on("click",()=>{
        //TODO: if logout from the modules page, should redirect to the spaindex.html page
        const logoutRequest = {
            postLogoutRedirectUri: globalAppSettings.logoutRedirectUri,
            mainWindowRedirectUri: globalAppSettings.logoutRedirectUri
        };
    
        this.myMSALObj.logoutPopup(logoutRequest);
    })

    adtUIBtn.on("click",()=>{
        window.open("digitaltwinmodule.html", "_blank");
    })

    //if this page is open in localhost environment, add three buttons to allow pages opening and using local running api app instead
    // of cloud api app in azure app service. In production environment, these buttons will never show
    if(window.location.href.startsWith("http://localhost")){
        var deviceManageLocalAPIBtn=$('<button class="w3-button w3-dark-grey w3-card w3-padding-16 w3-margin-bottom" >Device Management(Local API)</button>')
        var adtUILocalAPIBtn=$('<button class="w3-button w3-dark-grey w3-card w3-padding-16 w3-margin-bottom">Digital Twin(Local API)</button>')
        var eventLogLocalAPIBtn=$('<button class="w3-button w3-dark-grey w3-card w3-padding-16 w3-margin-bottom">Event Log(Local API)</button>')
        $('#middleDIV').append(deviceManageLocalAPIBtn,adtUILocalAPIBtn,eventLogLocalAPIBtn) 

        adtUILocalAPIBtn.on("click",()=>{
            window.open("digitaltwinmodule.html?test=1", "_blank");
        })
    }
    
}

module.exports = new mainUI();
},{"./globalAppSettings":1,"./msalHelper":3}],3:[function(require,module,exports){
const globalAppSettings=require("./globalAppSettings")

function msalHelper(){
    this.myMSALObj = new msal.PublicClientApplication(globalAppSettings.msalConfig);
}

msalHelper.prototype.signIn=async function(){
    try{
        var response= await this.myMSALObj.loginPopup({ scopes: globalAppSettings.b2cScopes })
        if (response != null){
            this.setAccount(response.account)
            return response.account
        } 
        else  return this.fetchAccount()
    }catch(e){
        if(e.errorCode!="user_cancelled") console.log(e)
    }
}

msalHelper.prototype.setAccount=function(theAccount){
    if(theAccount==null)return;
    this.accountId = theAccount.homeAccountId;
    this.username = theAccount.username;
}

msalHelper.prototype.fetchAccount=function(noAnimation){
    const currentAccounts = this.myMSALObj.getAllAccounts();
    if (currentAccounts.length < 1) return;
    var foundAccount=null;
    for(var i=0;i<currentAccounts.length;i++){
        var anAccount= currentAccounts[i]
        if(anAccount.homeAccountId.toUpperCase().includes(globalAppSettings.b2cSignUpSignInName.toUpperCase())
            && anAccount.idTokenClaims.iss.toUpperCase().includes(globalAppSettings.msalConfig.auth.knownAuthorities[0].toUpperCase())
            && anAccount.idTokenClaims.aud === globalAppSettings.msalConfig.auth.clientId
        ){
            foundAccount= anAccount;
        }
    }
    this.setAccount(foundAccount)
    return foundAccount;
}

msalHelper.prototype.callAPI=async function(APIString,RESTMethod,payload){
    var headersObj={}
    if(!globalAppSettings.isLocalTest){
        var token=await this.getToken()
        headersObj["Authorization"]=`Bearer ${token}`
    } 
    return new Promise((resolve, reject) => {
        $.ajax({
            type: RESTMethod || 'GET',
            "headers":headersObj,
            url: globalAppSettings.taskMasterAPIURI+APIString,
            crossDomain: true,
            success: function (responseData, textStatus, jqXHR) {
                resolve(responseData)
            },
            error: function (responseData, textStatus, errorThrown) {
                reject(responseData)
            }
        });
    })
}

msalHelper.prototype.getToken=async function(){
    try{
        if(this.storedToken!=null){
            var currTime=parseInt(new Date().getTime()/1000)
            if(currTime+60 < this.storedTokenExp) return this.storedToken
        }
        var tokenRequest={
            scopes: globalAppSettings.b2cScopes,
            forceRefresh: false, // Set this to "true" to skip a cached token and go to the server to get a new token
            account: this.myMSALObj.getAccountByHomeId(this.accountId)
        }
    
        var response = await this.myMSALObj.acquireTokenSilent(tokenRequest)
        if (!response.accessToken || response.accessToken === "") {
            throw new msal.InteractionRequiredAuthError;
        }

        this.storedToken=response.accessToken
        this.storedTokenExp=response.idTokenClaims.exp
    }catch(error){
        if (error instanceof msal.InteractionRequiredAuthError) {
            // fallback to interaction when silent call fails
            var response=await this.myMSALObj.acquireTokenPopup(tokenRequest)
        } else {
            throw error;
        }
    }

    return response.accessToken;
}

module.exports = new msalHelper();
},{"./globalAppSettings":1}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi9zcGFTb3VyY2VDb2RlL2dsb2JhbEFwcFNldHRpbmdzLmpzIiwiLi4vc3BhU291cmNlQ29kZS9tYWluVUkuanMiLCIuLi9zcGFTb3VyY2VDb2RlL21zYWxIZWxwZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImNvbnN0IHNpZ251cHNpZ25pbm5hbWU9XCJCMkNfMV9zaW5ndXBzaWduaW5fc3BhYXBwMVwiXHJcbmNvbnN0IGIyY1RlbmFudE5hbWU9XCJhenVyZWlvdGIyY1wiXHJcblxyXG5jb25zdCB1cmwgPSBuZXcgVVJMKHdpbmRvdy5sb2NhdGlvbi5ocmVmKTtcclxuXHJcbnZhciBzdHJBcnI9d2luZG93LmxvY2F0aW9uLmhyZWYuc3BsaXQoXCI/XCIpXHJcbnZhciBpc0xvY2FsVGVzdD0oc3RyQXJyLmluZGV4T2YoXCJ0ZXN0PTFcIikhPS0xKVxyXG5cclxuY29uc3QgZ2xvYmFsQXBwU2V0dGluZ3M9e1xyXG4gICAgXCJiMmNTaWduVXBTaWduSW5OYW1lXCI6IHNpZ251cHNpZ25pbm5hbWUsXHJcbiAgICBcImIyY1Njb3Blc1wiOltcImh0dHBzOi8vXCIrYjJjVGVuYW50TmFtZStcIi5vbm1pY3Jvc29mdC5jb20vdGFza21hc3Rlcm1vZHVsZS9vcGVyYXRpb25cIl0sXHJcbiAgICBcImxvZ291dFJlZGlyZWN0VXJpXCI6IHVybC5vcmlnaW4rXCIvc3BhaW5kZXguaHRtbFwiLFxyXG4gICAgXCJtc2FsQ29uZmlnXCI6e1xyXG4gICAgICAgIGF1dGg6IHtcclxuICAgICAgICAgICAgY2xpZW50SWQ6IFwiZjQ2OTNiZTUtNjAxYi00ZDBlLTkyMDgtYzM1ZDlhZDYyMzg3XCIsXHJcbiAgICAgICAgICAgIGF1dGhvcml0eTogXCJodHRwczovL1wiK2IyY1RlbmFudE5hbWUrXCIuYjJjbG9naW4uY29tL1wiK2IyY1RlbmFudE5hbWUrXCIub25taWNyb3NvZnQuY29tL1wiK3NpZ251cHNpZ25pbm5hbWUsXHJcbiAgICAgICAgICAgIGtub3duQXV0aG9yaXRpZXM6IFtiMmNUZW5hbnROYW1lK1wiLmIyY2xvZ2luLmNvbVwiXSxcclxuICAgICAgICAgICAgcmVkaXJlY3RVcmk6IHdpbmRvdy5sb2NhdGlvbi5ocmVmXHJcbiAgICAgICAgfSxcclxuICAgICAgICBjYWNoZToge1xyXG4gICAgICAgICAgICBjYWNoZUxvY2F0aW9uOiBcInNlc3Npb25TdG9yYWdlXCIsIFxyXG4gICAgICAgICAgICBzdG9yZUF1dGhTdGF0ZUluQ29va2llOiBmYWxzZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc3lzdGVtOiB7XHJcbiAgICAgICAgICAgIGxvZ2dlck9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIGxvZ2dlckNhbGxiYWNrOiAobGV2ZWwsIG1lc3NhZ2UsIGNvbnRhaW5zUGlpKSA9PiB7fVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIFwiaXNMb2NhbFRlc3RcIjppc0xvY2FsVGVzdCxcclxuICAgIFwidGFza01hc3RlckFQSVVSSVwiOigoaXNMb2NhbFRlc3QpP1wiaHR0cDovL2xvY2FsaG9zdDo1MDAwL1wiOlwiaHR0cHM6Ly9henVyZWlvdHJvY2tzdGFza21hc3Rlcm1vZHVsZS5henVyZXdlYnNpdGVzLm5ldC9cIilcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBnbG9iYWxBcHBTZXR0aW5nczsiLCIvL3RoZSBTdGFydCBwYWdlIGlzIHRoZSBzaWduIGluIHBhZ2VcclxuY29uc3QgZ2xvYmFsQXBwU2V0dGluZ3M9cmVxdWlyZShcIi4vZ2xvYmFsQXBwU2V0dGluZ3NcIilcclxuY29uc3QgbXNhbEhlbHBlcj1yZXF1aXJlKFwiLi9tc2FsSGVscGVyXCIpXHJcblxyXG5mdW5jdGlvbiBtYWluVUkoKSB7XHJcbiAgICB0aGlzLm15TVNBTE9iaiA9IG5ldyBtc2FsLlB1YmxpY0NsaWVudEFwcGxpY2F0aW9uKGdsb2JhbEFwcFNldHRpbmdzLm1zYWxDb25maWcpO1xyXG4gICAgJCgnI3NpZ25JbkJ0bicpLm9uKFwiY2xpY2tcIixhc3luYyAoKT0+e1xyXG4gICAgICAgIHZhciB0aGVBY2NvdW50PWF3YWl0IG1zYWxIZWxwZXIuc2lnbkluKClcclxuICAgICAgICBpZih0aGVBY2NvdW50IT1udWxsKSB0aGlzLmFmdGVyU2lnbmVkSW4odGhlQWNjb3VudCk7XHJcbiAgICB9KVxyXG4gICAgLy9pbiBjYXNlIG9mIHBhZ2UgcmVmcmVzaCBhbmQgaXQgbWlnaHQgYmUgb2sgdG8gZmV0Y2ggYWNjb3VudCBkaXJlY3RseSBmcm9tIGNhY2hlXHJcbiAgICB2YXIgdGhlQWNjb3VudD1tc2FsSGVscGVyLmZldGNoQWNjb3VudCgpOyBcclxuICAgIGlmKHRoZUFjY291bnQhPW51bGwpIHRoaXMuYWZ0ZXJTaWduZWRJbih0aGVBY2NvdW50LFwibm9BbmltYXRpb25cIilcclxufVxyXG5cclxubWFpblVJLnByb3RvdHlwZS5hZnRlclNpZ25lZEluPWZ1bmN0aW9uKGFuQWNjb3VudCxub0FuaW1hdGlvbil7XHJcbiAgICBpZihub0FuaW1hdGlvbil7XHJcbiAgICAgICAgJCgnI2hlYWRlclBhcnQnKS5jc3Moe2hlaWdodDpcIjEwMHZoXCIsXCJwYWRkaW5nXCI6XCIxNXB4XCJ9KVxyXG4gICAgICAgIHRoaXMuc2hvd01vZHVsZUJ1dHRvbnMoKVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgJCgnI2hlYWRlclBhcnQnKS5hbmltYXRlKHtoZWlnaHQ6XCIxMDB2aFwifSlcclxuICAgICAgICAkKCcjZ2l0aHVibGluaycpLmFuaW1hdGUoe29wYWNpdHk6XCIwXCJ9KVxyXG4gICAgICAgICQoJyNzaWduSW5CdG4nKS5hbmltYXRlKHtvcGFjaXR5OlwiMFwifSlcclxuICAgICAgICAkKCcjZm9vdGVyUGFydCcpLmFuaW1hdGUoe29wYWNpdHk6XCIwXCJ9LCgpPT57dGhpcy5zaG93TW9kdWxlQnV0dG9ucygpfSlcclxuICAgICAgICAkKCcjaGVhZGVyUGFydCcpLmFuaW1hdGUoe1wicGFkZGluZ1wiOlwiMTVweFwifSlcclxuICAgIH1cclxufVxyXG5cclxubWFpblVJLnByb3RvdHlwZS5zaG93TW9kdWxlQnV0dG9ucz1mdW5jdGlvbigpe1xyXG4gICAgJCgnI2dpdGh1YmxpbmsnKS5yZW1vdmUoKVxyXG4gICAgJCgnI3NpZ25JbkJ0bicpLnJlbW92ZSgpXHJcbiAgICAkKCcjZGVzY3JpcHRpb25QYXJ0JykucmVtb3ZlKClcclxuICAgICQoJyNmb290ZXJQYXJ0JykucmVtb3ZlKClcclxuXHJcbiAgICAvLyQoJyNoZWFkZXJQYXJ0JykuZW1wdHkoKVxyXG4gICAgdmFyIGRldmljZU1hbmFnZUJ0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWhvdmVyLWFtYmVyIHczLXJpcHBsZSB3My1jYXJkIHczLXBhZGRpbmctMTYgdzMtbWFyZ2luLWJvdHRvbVwiIHN0eWxlPVwid2lkdGg6NTUwcHg7ZGlzcGxheTpibG9ja1wiPkRldmljZSBNYW5hZ2VtZW50PC9idXR0b24+JylcclxuICAgIHZhciBhZHRVSUJ0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWhvdmVyLWFtYmVyIHczLXJpcHBsZSB3My1jYXJkIHczLXBhZGRpbmctMTYgdzMtbWFyZ2luLWJvdHRvbVwiIHN0eWxlPVwid2lkdGg6NTUwcHg7ZGlzcGxheTpibG9ja1wiPkRpZ2l0YWwgVHdpbjwvYnV0dG9uPicpXHJcbiAgICB2YXIgZXZlbnRMb2dCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ob3Zlci1hbWJlciB3My1yaXBwbGUgdzMtY2FyZCB3My1wYWRkaW5nLTE2IHczLW1hcmdpbi1ib3R0b21cIiBzdHlsZT1cIndpZHRoOjU1MHB4O2Rpc3BsYXk6YmxvY2tcIj5FdmVudCBMb2c8L2J1dHRvbj4nKVxyXG4gICAgdmFyIGxvZ291dEJ0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJsYWNrIHczLXJpcHBsZSB3My1jYXJkIHczLXBhZGRpbmctMTYgdzMtbWFyZ2luLWJvdHRvbVwiIHN0eWxlPVwid2lkdGg6MzUwcHg7ZGlzcGxheTpibG9jazttYXJnaW4tbGVmdDoxMDBweDttYXJnaW4tdG9wOjMycHhcIj5TaWduIE91dDwvYnV0dG9uPicpXHJcbiAgICBcclxuICAgICQoJyNoZWFkZXJQYXJ0JykuYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJ3aWR0aDo1MCVcIiBjbGFzcz1cInczLWNvbnRhaW5lciAgdzMtY2VsbCBcIj48L2Rpdj48ZGl2IGlkPVwibWlkZGxlRElWXCIgY2xhc3M9XCJ3My1jb250YWluZXIgdzMtY2VsbCB3My1jZWxsLW1pZGRsZVwiIHN0eWxlPVwiaGVpZ2h0OjUwdmhcIj48L2Rpdj48ZGl2IHN0eWxlPVwid2lkdGg6NTAlXCIgY2xhc3M9XCJ3My1jb250YWluZXIgdzMtY2VsbFwiPicpKVxyXG4gICAgJCgnI21pZGRsZURJVicpLmFwcGVuZChkZXZpY2VNYW5hZ2VCdG4sYWR0VUlCdG4sZXZlbnRMb2dCdG4sbG9nb3V0QnRuKSBcclxuXHJcbiAgICBsb2dvdXRCdG4ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgLy9UT0RPOiBpZiBsb2dvdXQgZnJvbSB0aGUgbW9kdWxlcyBwYWdlLCBzaG91bGQgcmVkaXJlY3QgdG8gdGhlIHNwYWluZGV4Lmh0bWwgcGFnZVxyXG4gICAgICAgIGNvbnN0IGxvZ291dFJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHBvc3RMb2dvdXRSZWRpcmVjdFVyaTogZ2xvYmFsQXBwU2V0dGluZ3MubG9nb3V0UmVkaXJlY3RVcmksXHJcbiAgICAgICAgICAgIG1haW5XaW5kb3dSZWRpcmVjdFVyaTogZ2xvYmFsQXBwU2V0dGluZ3MubG9nb3V0UmVkaXJlY3RVcmlcclxuICAgICAgICB9O1xyXG4gICAgXHJcbiAgICAgICAgdGhpcy5teU1TQUxPYmoubG9nb3V0UG9wdXAobG9nb3V0UmVxdWVzdCk7XHJcbiAgICB9KVxyXG5cclxuICAgIGFkdFVJQnRuLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIHdpbmRvdy5vcGVuKFwiZGlnaXRhbHR3aW5tb2R1bGUuaHRtbFwiLCBcIl9ibGFua1wiKTtcclxuICAgIH0pXHJcblxyXG4gICAgLy9pZiB0aGlzIHBhZ2UgaXMgb3BlbiBpbiBsb2NhbGhvc3QgZW52aXJvbm1lbnQsIGFkZCB0aHJlZSBidXR0b25zIHRvIGFsbG93IHBhZ2VzIG9wZW5pbmcgYW5kIHVzaW5nIGxvY2FsIHJ1bm5pbmcgYXBpIGFwcCBpbnN0ZWFkXHJcbiAgICAvLyBvZiBjbG91ZCBhcGkgYXBwIGluIGF6dXJlIGFwcCBzZXJ2aWNlLiBJbiBwcm9kdWN0aW9uIGVudmlyb25tZW50LCB0aGVzZSBidXR0b25zIHdpbGwgbmV2ZXIgc2hvd1xyXG4gICAgaWYod2luZG93LmxvY2F0aW9uLmhyZWYuc3RhcnRzV2l0aChcImh0dHA6Ly9sb2NhbGhvc3RcIikpe1xyXG4gICAgICAgIHZhciBkZXZpY2VNYW5hZ2VMb2NhbEFQSUJ0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWRhcmstZ3JleSB3My1jYXJkIHczLXBhZGRpbmctMTYgdzMtbWFyZ2luLWJvdHRvbVwiID5EZXZpY2UgTWFuYWdlbWVudChMb2NhbCBBUEkpPC9idXR0b24+JylcclxuICAgICAgICB2YXIgYWR0VUlMb2NhbEFQSUJ0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWRhcmstZ3JleSB3My1jYXJkIHczLXBhZGRpbmctMTYgdzMtbWFyZ2luLWJvdHRvbVwiPkRpZ2l0YWwgVHdpbihMb2NhbCBBUEkpPC9idXR0b24+JylcclxuICAgICAgICB2YXIgZXZlbnRMb2dMb2NhbEFQSUJ0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWRhcmstZ3JleSB3My1jYXJkIHczLXBhZGRpbmctMTYgdzMtbWFyZ2luLWJvdHRvbVwiPkV2ZW50IExvZyhMb2NhbCBBUEkpPC9idXR0b24+JylcclxuICAgICAgICAkKCcjbWlkZGxlRElWJykuYXBwZW5kKGRldmljZU1hbmFnZUxvY2FsQVBJQnRuLGFkdFVJTG9jYWxBUElCdG4sZXZlbnRMb2dMb2NhbEFQSUJ0bikgXHJcblxyXG4gICAgICAgIGFkdFVJTG9jYWxBUElCdG4ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgICAgIHdpbmRvdy5vcGVuKFwiZGlnaXRhbHR3aW5tb2R1bGUuaHRtbD90ZXN0PTFcIiwgXCJfYmxhbmtcIik7XHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuICAgIFxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBtYWluVUkoKTsiLCJjb25zdCBnbG9iYWxBcHBTZXR0aW5ncz1yZXF1aXJlKFwiLi9nbG9iYWxBcHBTZXR0aW5nc1wiKVxyXG5cclxuZnVuY3Rpb24gbXNhbEhlbHBlcigpe1xyXG4gICAgdGhpcy5teU1TQUxPYmogPSBuZXcgbXNhbC5QdWJsaWNDbGllbnRBcHBsaWNhdGlvbihnbG9iYWxBcHBTZXR0aW5ncy5tc2FsQ29uZmlnKTtcclxufVxyXG5cclxubXNhbEhlbHBlci5wcm90b3R5cGUuc2lnbkluPWFzeW5jIGZ1bmN0aW9uKCl7XHJcbiAgICB0cnl7XHJcbiAgICAgICAgdmFyIHJlc3BvbnNlPSBhd2FpdCB0aGlzLm15TVNBTE9iai5sb2dpblBvcHVwKHsgc2NvcGVzOiBnbG9iYWxBcHBTZXR0aW5ncy5iMmNTY29wZXMgfSlcclxuICAgICAgICBpZiAocmVzcG9uc2UgIT0gbnVsbCl7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0QWNjb3VudChyZXNwb25zZS5hY2NvdW50KVxyXG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuYWNjb3VudFxyXG4gICAgICAgIH0gXHJcbiAgICAgICAgZWxzZSAgcmV0dXJuIHRoaXMuZmV0Y2hBY2NvdW50KClcclxuICAgIH1jYXRjaChlKXtcclxuICAgICAgICBpZihlLmVycm9yQ29kZSE9XCJ1c2VyX2NhbmNlbGxlZFwiKSBjb25zb2xlLmxvZyhlKVxyXG4gICAgfVxyXG59XHJcblxyXG5tc2FsSGVscGVyLnByb3RvdHlwZS5zZXRBY2NvdW50PWZ1bmN0aW9uKHRoZUFjY291bnQpe1xyXG4gICAgaWYodGhlQWNjb3VudD09bnVsbClyZXR1cm47XHJcbiAgICB0aGlzLmFjY291bnRJZCA9IHRoZUFjY291bnQuaG9tZUFjY291bnRJZDtcclxuICAgIHRoaXMudXNlcm5hbWUgPSB0aGVBY2NvdW50LnVzZXJuYW1lO1xyXG59XHJcblxyXG5tc2FsSGVscGVyLnByb3RvdHlwZS5mZXRjaEFjY291bnQ9ZnVuY3Rpb24obm9BbmltYXRpb24pe1xyXG4gICAgY29uc3QgY3VycmVudEFjY291bnRzID0gdGhpcy5teU1TQUxPYmouZ2V0QWxsQWNjb3VudHMoKTtcclxuICAgIGlmIChjdXJyZW50QWNjb3VudHMubGVuZ3RoIDwgMSkgcmV0dXJuO1xyXG4gICAgdmFyIGZvdW5kQWNjb3VudD1udWxsO1xyXG4gICAgZm9yKHZhciBpPTA7aTxjdXJyZW50QWNjb3VudHMubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIGFuQWNjb3VudD0gY3VycmVudEFjY291bnRzW2ldXHJcbiAgICAgICAgaWYoYW5BY2NvdW50LmhvbWVBY2NvdW50SWQudG9VcHBlckNhc2UoKS5pbmNsdWRlcyhnbG9iYWxBcHBTZXR0aW5ncy5iMmNTaWduVXBTaWduSW5OYW1lLnRvVXBwZXJDYXNlKCkpXHJcbiAgICAgICAgICAgICYmIGFuQWNjb3VudC5pZFRva2VuQ2xhaW1zLmlzcy50b1VwcGVyQ2FzZSgpLmluY2x1ZGVzKGdsb2JhbEFwcFNldHRpbmdzLm1zYWxDb25maWcuYXV0aC5rbm93bkF1dGhvcml0aWVzWzBdLnRvVXBwZXJDYXNlKCkpXHJcbiAgICAgICAgICAgICYmIGFuQWNjb3VudC5pZFRva2VuQ2xhaW1zLmF1ZCA9PT0gZ2xvYmFsQXBwU2V0dGluZ3MubXNhbENvbmZpZy5hdXRoLmNsaWVudElkXHJcbiAgICAgICAgKXtcclxuICAgICAgICAgICAgZm91bmRBY2NvdW50PSBhbkFjY291bnQ7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgdGhpcy5zZXRBY2NvdW50KGZvdW5kQWNjb3VudClcclxuICAgIHJldHVybiBmb3VuZEFjY291bnQ7XHJcbn1cclxuXHJcbm1zYWxIZWxwZXIucHJvdG90eXBlLmNhbGxBUEk9YXN5bmMgZnVuY3Rpb24oQVBJU3RyaW5nLFJFU1RNZXRob2QscGF5bG9hZCl7XHJcbiAgICB2YXIgaGVhZGVyc09iaj17fVxyXG4gICAgaWYoIWdsb2JhbEFwcFNldHRpbmdzLmlzTG9jYWxUZXN0KXtcclxuICAgICAgICB2YXIgdG9rZW49YXdhaXQgdGhpcy5nZXRUb2tlbigpXHJcbiAgICAgICAgaGVhZGVyc09ialtcIkF1dGhvcml6YXRpb25cIl09YEJlYXJlciAke3Rva2VufWBcclxuICAgIH0gXHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgIHR5cGU6IFJFU1RNZXRob2QgfHwgJ0dFVCcsXHJcbiAgICAgICAgICAgIFwiaGVhZGVyc1wiOmhlYWRlcnNPYmosXHJcbiAgICAgICAgICAgIHVybDogZ2xvYmFsQXBwU2V0dGluZ3MudGFza01hc3RlckFQSVVSSStBUElTdHJpbmcsXHJcbiAgICAgICAgICAgIGNyb3NzRG9tYWluOiB0cnVlLFxyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAocmVzcG9uc2VEYXRhLCB0ZXh0U3RhdHVzLCBqcVhIUikge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZXNwb25zZURhdGEpXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAocmVzcG9uc2VEYXRhLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikge1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KHJlc3BvbnNlRGF0YSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSlcclxufVxyXG5cclxubXNhbEhlbHBlci5wcm90b3R5cGUuZ2V0VG9rZW49YXN5bmMgZnVuY3Rpb24oKXtcclxuICAgIHRyeXtcclxuICAgICAgICBpZih0aGlzLnN0b3JlZFRva2VuIT1udWxsKXtcclxuICAgICAgICAgICAgdmFyIGN1cnJUaW1lPXBhcnNlSW50KG5ldyBEYXRlKCkuZ2V0VGltZSgpLzEwMDApXHJcbiAgICAgICAgICAgIGlmKGN1cnJUaW1lKzYwIDwgdGhpcy5zdG9yZWRUb2tlbkV4cCkgcmV0dXJuIHRoaXMuc3RvcmVkVG9rZW5cclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHRva2VuUmVxdWVzdD17XHJcbiAgICAgICAgICAgIHNjb3BlczogZ2xvYmFsQXBwU2V0dGluZ3MuYjJjU2NvcGVzLFxyXG4gICAgICAgICAgICBmb3JjZVJlZnJlc2g6IGZhbHNlLCAvLyBTZXQgdGhpcyB0byBcInRydWVcIiB0byBza2lwIGEgY2FjaGVkIHRva2VuIGFuZCBnbyB0byB0aGUgc2VydmVyIHRvIGdldCBhIG5ldyB0b2tlblxyXG4gICAgICAgICAgICBhY2NvdW50OiB0aGlzLm15TVNBTE9iai5nZXRBY2NvdW50QnlIb21lSWQodGhpcy5hY2NvdW50SWQpXHJcbiAgICAgICAgfVxyXG4gICAgXHJcbiAgICAgICAgdmFyIHJlc3BvbnNlID0gYXdhaXQgdGhpcy5teU1TQUxPYmouYWNxdWlyZVRva2VuU2lsZW50KHRva2VuUmVxdWVzdClcclxuICAgICAgICBpZiAoIXJlc3BvbnNlLmFjY2Vzc1Rva2VuIHx8IHJlc3BvbnNlLmFjY2Vzc1Rva2VuID09PSBcIlwiKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBtc2FsLkludGVyYWN0aW9uUmVxdWlyZWRBdXRoRXJyb3I7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnN0b3JlZFRva2VuPXJlc3BvbnNlLmFjY2Vzc1Rva2VuXHJcbiAgICAgICAgdGhpcy5zdG9yZWRUb2tlbkV4cD1yZXNwb25zZS5pZFRva2VuQ2xhaW1zLmV4cFxyXG4gICAgfWNhdGNoKGVycm9yKXtcclxuICAgICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBtc2FsLkludGVyYWN0aW9uUmVxdWlyZWRBdXRoRXJyb3IpIHtcclxuICAgICAgICAgICAgLy8gZmFsbGJhY2sgdG8gaW50ZXJhY3Rpb24gd2hlbiBzaWxlbnQgY2FsbCBmYWlsc1xyXG4gICAgICAgICAgICB2YXIgcmVzcG9uc2U9YXdhaXQgdGhpcy5teU1TQUxPYmouYWNxdWlyZVRva2VuUG9wdXAodG9rZW5SZXF1ZXN0KVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzcG9uc2UuYWNjZXNzVG9rZW47XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IG1zYWxIZWxwZXIoKTsiXX0=