@RestResource(urlMapping='/slack/*')
global with sharing class TSCustomDakoku {
    public List<teamspirit__AtkEmpDay__c> empDays;
    public String empId;
    public Integer yearMonth;
    public String startDate;
    public String lastModifiedDate;
    public Integer stdStartTime;
    public Integer stdEndTime;
    public teamspirit__AtkEmpDay__c empToday;

	public TSCustomDakoku(){
    	loadData();
	}

    private Date getToday() {
        return Date.today();
    }

    @HttpGet
    global static LIST<String> handleInput() {
    	RestRequest req = RestContext.request;
    	RestResponse res = RestContext.response;

    	system.debug('req ' + req);
    	String switchparam =  req.params.get('switchparam');
        LIST<String> result = new LIST<String>();
    	if(switchparam == '0' || switchparam == '1'){
    		result = getUnAttendanceDakokuUsers(switchparam);
    	}
    	system.debug('result ' + result);
        return result;
    }


    @HttpPut
    global static String handleSetAttendance(String attendanceTime,Boolean attendance,String slackid) {
        TSCustomDakoku ctrl = new TSCustomDakoku();
        if (ctrl.setAttendance(attendanceTime,attendance,slackid)) {
            return 'OK';
        }
        return 'NG';
    }


	public static LIST<String> getUnAttendanceDakokuUsers(String switchparam){
    	LIST<String> unDakokuUsers = new LIST<String>();

    	LIST<User> lnestStaffs = [SELECT Name,Email,slackid__c,UserRole.Name From User WHERE (UserRole.Name LIKE '%事業部%' OR UserRole.Name LIKE '%総務%') AND noWeeklyReportRequired__c = false AND IsActive = true AND id != '00510000001tdbq' AND id != '00510000005nwz1' AND id != '00510000007jUib' ORDER BY UserRole.Name LIMIT 2000];
		LIST<String> lnestStaffSlackIDs = notSlackIDs(lnestStaffs,switchparam);
        system.debug('lnestStaffSlackIDs: ' + lnestStaffSlackIDs);
    	return lnestStaffSlackIDs;
    }


    public Boolean setAttendance(String attendanceTime,Boolean attendance,String slackid) {
    	Integer hour = Integer.valueOf(attendanceTime.left(2));
    	Integer minute = Integer.valueOf(attendanceTime.right(2));
        Integer timeHM = hour * 60 + minute;
        Map<String, Object> params = getBaseParams();
        Map<String, Object> input = new Map<String, Object>{'comment' => '', 'time' => timeHM, 'face' => attendance ? 0 : 1, 'fix' => false, 'type' => 10};
        params.put('input', input);
        params.put('prevFlag', false);
        params.put('stdStartTime', stdStartTime);
        params.put('stdEndTime', stdEndTime);
        String jsonReq = JSON.serialize(params);
        Map<String, Object> res = teamspirit.RtkPotalCtl.inputTime(jsonReq);
        lastModifiedDate = String.valueOf(res.get('lastModifiedDate'));
    	LIST<teamspirit__AtkEmpDay__c> updateTimeData = new LIST<teamspirit__AtkEmpDay__c>();
        if(res.get('result') == 'OK'){//新規登録の場合はOKが返ってくる
	        updateTimeData = (LIST<teamspirit__AtkEmpDay__c>)res.get('empDays'); 	
        }else if(res.get('result') == 'NG'){//修正の場合
        	Date today = Date.today();
        	system.debug('SELECT ID FROM teamspirit__AtkEmpDay__c WHERE targetUserSlackID__c = :slackid AND teamspirit__Date__c = ' + String.valueOf(today).left(10));
        	updateTimeData = [SELECT ID FROM teamspirit__AtkEmpDay__c WHERE targetUserSlackID__c = :slackid AND teamspirit__Date__c = :today LIMIT 1];
        }else{
        	
        }
        system.debug('updateTimeData:' + updateTimeData);
        if(attendance == true){
	        updateTimeData[0].teamspirit__StartTime__c = timeHM;        	
        }else{
	        updateTimeData[0].teamspirit__EndTime__c = timeHM;        	        	
        }
        update updateTimeData[0];
        return true;
    }

    public Boolean updateTimeTable(List<Map<String, Integer>> timeTable) {
        Map<String, Object> params = getBaseParams();
        params.put('timeTable', timeTable);
        String jsonReq = JSON.serialize(params);
        Map<String, Object> res = teamspirit.RtkPotalCtl.inputTimeTable(jsonReq);
        lastModifiedDate = String.valueOf(res.get('lastModifiedDate'));
        return res.get('result') == 'OK';
    }

    private static LIST<teamspirit__AtkEmpDay__c> getAttended(){
        LIST<teamspirit__AtkEmpDay__c> attended = new LIST<teamspirit__AtkEmpDay__c>();
        Date today = Date.today();
		attended = [
            		SELECT 
                    			CreatedById ,
            					targetUserID__c,
            					targetUserSlackID__c,
                    			id,
                    			teamspirit__StartTime__c 
                    FROM 
            					teamspirit__AtkEmpDay__c 
            		WHERE 
            					teamspirit__StartTime__c != NULL AND 
            					teamspirit__Date__c = :today
        			];
        return attended;
    }

    private static LIST<teamspirit__AtkEmpDay__c> getLeft(){
        LIST<teamspirit__AtkEmpDay__c> left = new LIST<teamspirit__AtkEmpDay__c>();
        Date today = Date.today();
		left = [
            		SELECT 
                    			CreatedById ,
            					targetUserID__c,
            					targetUserSlackID__c,
                    			id,
                    			teamspirit__StartTime__c,
                    			teamspirit__EndTime__c 
                    FROM 
            					teamspirit__AtkEmpDay__c 
            		WHERE 
            					teamspirit__EndTime__c != NULL AND 
            					teamspirit__Date__c = :today
        			];
        return left;
    }    

    //打刻なしslackIDの取得
    private static LIST<String> notSlackIDs(LIST<User> lnestStaffs,String switchparam){
		SET<String> lnestStaffSlackIDs = new SET<String>();
        for(User u : lnestStaffs){
            lnestStaffSlackIDs.add(u.SlackID__c );
        }
        LIST<teamspirit__AtkEmpDay__c>doneUsers = new LIST<teamspirit__AtkEmpDay__c>();
        if(switchparam == '0'){
	        doneUsers = getAttended();
        }else if(switchparam == '1'){
	        doneUsers = getLeft();
        }

		LIST<String> attendedSlackIDs = new LIST<String>();
        for(teamspirit__AtkEmpDay__c u : doneUsers){
            attendedSlackIDs.add(u.targetUserSlackID__c);
        }
        lnestStaffSlackIDs.removeALL(attendedSlackIDs);
        LIST<String> res = new LIST<String>();
        for(String s : lnestStaffSlackIDs){
            res.add(s);
        }
        return res;
    }

    private void loadData() {
        Map<String, Object> lastData = teamspirit.RtkPotalCtl.getLastModifiedDate();
        empId = (String) lastData.get('empId');
        lastModifiedDate = String.valueOf(lastData.get('lastModifiedDate'));
        Map<String, Object> empMonth = teamspirit.RtkPotalCtl.loadEmpMonth('');
        List<teamspirit__AtkConfig__c > configs = (List<teamspirit__AtkConfig__c>) empMonth.get('configs');
        teamspirit__AtkConfig__c config = configs != null && configs.size() > 0 ? configs[0] : null;
        if (config != null) {
            stdStartTime = Integer.valueOf(config.teamspirit__StdStartTime__c);
            stdEndTime = Integer.valueOf(config.teamspirit__StdEndTime__c);
        }
        empDays = (List<teamspirit__AtkEmpDay__c>) empMonth.get('empDays');
        if (empDays == null) {
            empDays = new List<teamspirit__AtkEmpDay__c>();
        }
        Date today = getToday();
        for (teamspirit__AtkEmpDay__c day: empDays) {
            if (day.teamspirit__Date__c == today) {
                empToday = day;
                break;
            }
        }
        yearMonth = (Integer) empMonth.get('yearMonth');
        startDate = (String) empMonth.get('startDate');
    }

    public Boolean isHoliday() {
        return empToday != null && empToday.teamspirit__DayType__c != null && Integer.valueOf(empToday.teamspirit__DayType__c) > 0 && empToday.teamspirit__HolidayWorkApplyId__c == null;
    }

    private Map<String, Object>getBaseParams() {
        Map<String, Object> params = new Map<String, Object>();
        params.put('empId', empId);
        params.put('month', yearMonth);
        params.put('startDate', startDate);
        params.put('lastModifiedDate', lastModifiedDate);
        params.put('date', DateTime.newInstance(getToday(), Time.newInstance(0, 0, 0, 0)).format('yyyy-MM-dd'));
        return params;
    }

}