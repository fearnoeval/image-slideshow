(ns com.fearnoeval.image-slideshow.core
  (:require [cljs.core.async :refer [<! chan put!]]
            [goog.dom :as gdom]
            [goog.dom.classlist :as gclasslist]
            [goog.dom.fullscreen :as gfs]
            [goog.events :as gevents])
  (:require-macros [cljs.core.async.macros :refer [go]])
  (:import [goog.events EventType]
           [goog.fs FileReader]))

(deftype FileListSeq [file-list i]
  ISeq
  (-first [_]
    (.item file-list i))
  (-rest [_]
    (if (< (inc i) (.-length file-list))
      (FileListSeq. file-list (inc i))
      (list)))

  ISeqable
  (-seq [this]
    this))

(extend-type js/FileList
  ISeqable
  (-seq [this]
    (FileListSeq. this 0)))

(def body
  (gdom/getElement "js-body"))

(def input
  (gdom/getElement "js-input"))

(def input-wrapper
  (gdom/getElement "js-input-wrapper"))

(def images-div
  (gdom/createDom "div" (js-obj "id" "js-images-div")))

(def keyword->event-type
  {:animation-end EventType.ANIMATIONEND
   :change        EventType.CHANGE
   :double-click  EventType.DBLCLICK
   :key-down      EventType.KEYDOWN
   :load          FileReader.EventType.LOAD
   :mouse-move    EventType.MOUSEMOVE})

(def f?
  #{"f" "F"})

(defn listen [el kw cb]
  (gevents/listen el (keyword->event-type kw) cb))

(defn unlisten [el kw cb]
  (gevents/unlisten el (keyword->event-type kw) cb))

(defn toggle-fullscreen []
  (if (gfs/isFullScreen)
    (gfs/exitFullScreen)
    (gfs/requestFullScreen body)))

(defn double-click-handler [_]
  (toggle-fullscreen))

(defn key-handler [e]
  (when (f? (char (.-keyCode e)))
    (toggle-fullscreen)))

(def mouse-move-handler
  (let [hide-mouse #(gclasslist/add body "no-cursor")
        timeout    #(.setTimeout js/window hide-mouse 1000)
        state      (volatile! {:timeout (timeout)})]
    (fn [e]
      (let [s       @state
            be      (.getBrowserEvent e)
            nx      (.-screenX be)
            ny      (.-screenY be)
            [ox oy] (:last-position s)
            idle?   (and ox oy (= ox nx) (= oy ny))]
        (when-not idle?
          (.clearTimeout js/window (:timeout s))
          (gclasslist/remove body "no-cursor")
          (vswap! state assoc :timeout (timeout) :last-position [nx ny]))))))

(defn file->chan [file]
  (let [c           (chan)
        file-reader (FileReader.)]
    (doto file-reader
      (listen :load (fn [_]
                      (put! c (.getResult file-reader))
                      (.dispose file-reader)))
      (.readAsDataUrl file))
    c))

(def image?
  (let [re #"^image.*$"]
    (fn [file]
      (re-matches re (.-type file)))))

(defn create-img-element [src]
  (gdom/createDom "img" (js-obj "class" "slide zero-opacity" "src" src)))

(defn slideshow [parent images]
  (let [all-images (shuffle images)
        c (chan)
        animation-end-listener #(put! c :animation-end)]
    (go
      (loop [el     (let [data-url (<! (file->chan (first all-images)))
                          el       (create-img-element data-url)]
                      (gdom/appendChild parent el)
                      el)
             images (next all-images)]
        (listen el :animation-end animation-end-listener)
        (gclasslist/add el "fade-in")
        (gclasslist/remove el "zero-opacity")
        (<! c)
        (gclasslist/remove el "fade-in")
        (gclasslist/add el "wait-and-fade-out")
        (let [next-image  (if images (first images) (first all-images))
              next-images (if images (next images) (next all-images))
              data-url   (<! (file->chan next-image))
              new-el     (create-img-element data-url)]
          (gdom/appendChild parent new-el)
          (<! c)
          (unlisten el :animation-end animation-end-listener)
          (gdom/removeNode el)
          (recur new-el next-images))))))

(defn input-handler [_]
  (let [images (filter image? (.-files input))]
    (when (> (count images) 0)
      (gdom/removeNode input)
      (listen input-wrapper :animation-end (fn []
                                             (gdom/removeNode input-wrapper)
                                             (gdom/appendChild body images-div)
                                             (slideshow images-div images)))
      (gclasslist/add input-wrapper "fade-out"))))

(defn -main []
  (listen input     :change       input-handler)
  (listen js/window :key-down     key-handler)
  (listen js/window :mouse-move   mouse-move-handler)
  (listen js/window :double-click double-click-handler))

(-main)
