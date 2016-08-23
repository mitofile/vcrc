package com.cache;

import java.util.Collection;

import org.json.JSONObject;

public class CatchupTVCache {
   private Collection<JSONObject> cache = null;
   private static CatchupTVCache instance = null;
   
   private CatchupTVCache(){}
   
   public static CatchupTVCache getInstance(){
	   if(instance==null){
		   instance = new CatchupTVCache();
	   }
	   return instance;
   }

public Collection<JSONObject> getCache() {
	return cache;
}

public void setCache(Collection<JSONObject> cache) {
	this.cache = cache;
}
   
}
