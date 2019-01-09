@isTest public class TSCustomDakokuTest {

	@isTest
	static void testHttpPostAttend() {
	    // prepare test-data

	    //As Per Best Practice it is important to instantiate the Rest Context
	    RestRequest req = new RestRequest();
	    RestResponse res = new RestResponse();
	    req.requestURI = '/services/apexrest/slack'; //Request URL
	    req.httpMethod = 'POST';

	    RestContext.request = req;
	    RestContext.response= res;

	    Test.startTest();
	    	String switchparam = '0';
	    	LIST<String> results = TSCustomDakoku.getUnAttendanceDakokuUsers(switchparam);
	    Test.stopTest();

	    System.assertEquals(results.isEmpty(),false);
	}

	@isTest
	static void testHttpPostLeft() {
	    // prepare test-data

	    //As Per Best Practice it is important to instantiate the Rest Context
	    RestRequest req = new RestRequest();
	    RestResponse res = new RestResponse();
	    req.requestURI = '/services/apexrest/slack'; //Request URL
	    req.httpMethod = 'POST';

	    RestContext.request = req;
	    RestContext.response= res;

	    Test.startTest();
	    	String switchparam = '1';
	    	LIST<String> results = TSCustomDakoku.getUnAttendanceDakokuUsers(switchparam);
	    Test.stopTest();

	    System.assertEquals(results.isEmpty(),false);
	}

	@isTest
	static void testHttpGet() {
	    // prepare test-data

	    //As Per Best Practice it is important to instantiate the Rest Context
	    RestRequest req = new RestRequest();
	    RestResponse res = new RestResponse();
	    req.requestURI = '/services/apexrest/slack'; //Request URL
	    req.httpMethod = 'GET';
    	req.addHeader('Content-Type', 'application/json');
		req.requestBody = Blob.valueof('{"switchparam": "1"}');

	    RestContext.request = req;
	    RestContext.response= res;

	    Test.startTest();
	    	String[] result = TSCustomDakoku.handleInput();
	    Test.stopTest();

	}

	@isTest(SeeAllData=true) 
	static void testHttpPut() {
	    // prepare test-data

	    //As Per Best Practice it is important to instantiate the Rest Context
	    RestRequest req = new RestRequest();
	    RestResponse res = new RestResponse();
	    req.requestURI = '/services/apexrest/slack'; //Request URL
	    req.httpMethod = 'PUT';
    	req.addHeader('Content-Type', 'application/json; charset=UTF-8');
		req.requestBody = Blob.valueof('{ "attendanceTime": "1212","attendance": true, "slackid": "U0BDBUMJS"}');

	    RestContext.request = req;
	    RestContext.response= res;

	    Test.startTest();
	    	String attendanceTime = '1212';
	    	Boolean attendance = true;
	    	String slackid = 'U0BDBUMJS';
	    	String result = TSCustomDakoku.handleSetAttendance(attendanceTime,attendance,slackid);
	    Test.stopTest();
	}


}