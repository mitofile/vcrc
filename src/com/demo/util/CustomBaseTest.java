package com.demo.util;

import java.lang.reflect.Method;

import org.junit.Rule;
import org.junit.rules.TestName;

public class CustomBaseTest {
	
	@Rule
    public TestName name = new TestName();
	
    public void logHeader(String methodIn) {
    	Method method = null;
		try {
			method = getClass().getMethod(methodIn);
			TestHeader header = method.getAnnotation(TestHeader.class);
	    	System.out.println("");
	    	System.out.println("########################## TEST HEADER ##########################");
	    	System.out.println("TCName: " + header.TCName());
	    	System.out.println("Description: " + header.Description());
	    	System.out.println("Priority: " + header.Priority());
	    	System.out.println("Service: " + header.Service());
	    	System.out.println("FunctionalArea: " + header.FunctionalArea());
	    	System.out.println("Link: " + header.Link());
	    	System.out.println("######################## END TEST HEADER ########################");
	    	System.out.println("");
		} catch (NoSuchMethodException e1) {
			// TODO Auto-generated catch block
			e1.printStackTrace();
		} catch (SecurityException e1) {
			// TODO Auto-generated catch block
			e1.printStackTrace();
		}
	}
}
