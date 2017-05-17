(defproject com.fearnoeval/image-slideshow "0.1.0-SNAPSHOT"
  :description "An image slideshow that runs in the browser using local files"
  :license {:name "Eclipse"
            :url "http://www.eclipse.org/legal/epl-v10.html"}
  :plugins      [[lein-cljsbuild            "1.1.4"]]
  :dependencies [[org.clojure/clojure       "1.9.0-alpha14"]
                 [org.clojure/clojurescript "1.9.293"]
                 [org.clojure/core.async    "0.2.395"]]
  :cljsbuild
    {:builds [{
      :source-paths ["src/cljs"]
      :compiler
        {:output-to "resources/main.js"
         :optimizations :advanced}}]})
