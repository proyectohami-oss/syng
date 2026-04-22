import { useState, useRef, useEffect } from 'react'
import { db } from './firebase'
import {
  collection, doc, onSnapshot, setDoc, deleteDoc,
  updateDoc, getDoc, writeBatch, arrayUnion, arrayRemove
} from 'firebase/firestore'
import { TEXTOS } from './idiomas'
import { CATALOGOS, DEP_ORDER_BY_LANG } from './catalogos'
