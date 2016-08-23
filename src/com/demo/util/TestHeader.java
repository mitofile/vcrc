package com.demo.util;

import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;


@Retention(RetentionPolicy.RUNTIME)

public @interface TestHeader {
	
	String   value() default "";

    String   TCName();
    String   Description();
    String   Priority();
    String   Service();
    String   FunctionalArea();
    String   Link(); 

}
