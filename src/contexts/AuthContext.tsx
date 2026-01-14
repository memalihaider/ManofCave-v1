// 'use client';

// import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// import { useRouter } from 'next/navigation';
// import { 
//   signInWithEmailAndPassword,
//   signOut,
//   onAuthStateChanged,
//   User as FirebaseUser
// } from 'firebase/auth';
// import { doc, getDoc } from 'firebase/firestore';
// import { auth, db } from '@/lib/firebase';

// interface User {
//   id: string;
//   email: string;
//   role: 'admin' | 'super_admin';
//   branchId?: string;
//   branchName?: string;
//   name?: string;
// }

// interface AuthContextType {
//   user: User | null;
//   login: (email: string, password: string) => Promise<boolean>;
//   logout: () => Promise<void>;
//   isLoading: boolean;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

// interface AuthProviderProps {
//   children: ReactNode;
// }

// export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const router = useRouter();

//   useEffect(() => {
//     // ✅ ONLY TRACK AUTH STATE, NO REDIRECTS
//     const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
//       if (firebaseUser) {
//         try {
//           const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
//           if (userDoc.exists()) {
//             const userData = userDoc.data();
//             const userObj: User = {
//               id: firebaseUser.uid,
//               email: firebaseUser.email!,
//               role: userData.role || 'admin',
//               branchId: userData.branchId,
//               branchName: userData.branchName,
//               name: userData.name
//             };
            
//             setUser(userObj);
//             localStorage.setItem('user', JSON.stringify(userObj));
            
//             console.log('✅ Auth state updated:', userObj.email, 'Role:', userObj.role);
//             // ❌ NO REDIRECT HERE!
            
//           } else {
//             console.error('❌ User document not found in Firestore');
//             await signOut(auth);
//             setUser(null);
//             localStorage.removeItem('user');
//           }
//         } catch (error) {
//           console.error('❌ Error fetching user data:', error);
//           await signOut(auth);
//           setUser(null);
//           localStorage.removeItem('user');
//         }
//       } else {
//         setUser(null);
//         localStorage.removeItem('user');
//         console.log('❌ User signed out');
//       }
//       setIsLoading(false);
//     });

//     return () => unsubscribe();
//   }, []); // ✅ Empty dependencies

//   const login = async (email: string, password: string): Promise<boolean> => {
//     setIsLoading(true);
    
//     try {
//       console.log('🔑 Login attempt for:', email);
      
//       // 1. Firebase Authentication se login
//       const userCredential = await signInWithEmailAndPassword(auth, email, password);
//       console.log('✅ Firebase auth successful');
      
//       // 2. Firestore se user data fetch karein
//       const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
//       if (!userDoc.exists()) {
//         throw new Error('User not found in database');
//       }
      
//       const userData = userDoc.data();
//       console.log('📋 User role from Firestore:', userData.role);
      
//       // 3. User object create karein
//       const userObj: User = {
//         id: userCredential.user.uid,
//         email: userCredential.user.email!,
//         role: userData.role || 'admin',
//         branchId: userData.branchId,
//         branchName: userData.branchName,
//         name: userData.name
//       };
      
//       // 4. State aur localStorage update karein
//       setUser(userObj);
//       localStorage.setItem('user', JSON.stringify(userObj));
//       console.log('✅ User state updated');
      
//       // 5. ✅ ONLY REDIRECT FROM LOGIN FUNCTION
//       if (userData.role === 'super_admin') {
//         console.log('🚀 SUPER ADMIN → Redirecting to /super-admin/branches');
//         router.push('/super-admin');
//       } else {
//         console.log('🚀 ADMIN → Redirecting to /admin/services');
//         router.push('/admin');
//       }
      
//       setIsLoading(false);
//       return true;
      
//     } catch (error: any) {
//       console.error('❌ Login error:', error.code, error.message);
//       setIsLoading(false);
      
//       let errorMessage = 'Login failed';
//       if (error.code === 'auth/user-not-found') {
//         errorMessage = 'User not found';
//       } else if (error.code === 'auth/wrong-password') {
//         errorMessage = 'Incorrect password';
//       } else if (error.code === 'auth/invalid-email') {
//         errorMessage = 'Invalid email address';
//       } else if (error.code === 'auth/invalid-credential') {
//         errorMessage = 'Invalid email or password';
//       }
      
//       throw new Error(errorMessage);
//     }
//   };

//   const logout = async () => {
//     try {
//       await signOut(auth);
//       setUser(null);
//       localStorage.removeItem('user');
//       router.push('/login');
//     } catch (error) {
//       console.error('Logout error:', error);
//     }
//   };

//   const value: AuthContextType = {
//     user,
//     login,
//     logout,
//     isLoading,
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// };
// new code
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

// UPDATED: Customer type add karein
interface User {
  id: string;
  email: string;
  role: 'admin' | 'super_admin' | 'customer'; // UPDATED: customer role add karein
  branchId?: string;
  branchName?: string;
  name?: string;
  phone?: string; // UPDATED: customer ke liye
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, isCustomer?: boolean) => Promise<boolean>; // UPDATED: parameter add karein
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          // FIRST: Check in "users" collection (for admins)
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            // User is ADMIN
            const userData = userDoc.data();
            const userObj: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              role: userData.role || 'admin',
              branchId: userData.branchId,
              branchName: userData.branchName,
              name: userData.name
            };
            
            setUser(userObj);
            localStorage.setItem('user', JSON.stringify(userObj));
            console.log('✅ Admin auth state updated:', userObj.email);
            
          } else {
            // SECOND: Check in "customers" collection
            const customerDoc = await getDoc(doc(db, 'customers', firebaseUser.uid));
            
            if (customerDoc.exists()) {
              // User is CUSTOMER
              const customerData = customerDoc.data();
              const userObj: User = {
                id: firebaseUser.uid,
                email: firebaseUser.email!,
                role: 'customer', // Fixed role for customers
                name: customerData.name,
                phone: customerData.phone,
                // branch fields not needed for customers
              };
              
              setUser(userObj);
              localStorage.setItem('user', JSON.stringify(userObj));
              console.log('✅ Customer auth state updated:', userObj.email);
              
            } else {
              // THIRD: If not found in either collection
              console.log('⚠️ User not found in Firestore, checking if new customer...');
              
              // Check if this might be a newly registered customer
              // by looking at localStorage
              const customerAuth = localStorage.getItem('customerAuth');
              if (customerAuth) {
                const parsed = JSON.parse(customerAuth);
                if (parsed.customer && parsed.customer.uid === firebaseUser.uid) {
                  // Create customer document in Firestore
                  await setDoc(doc(db, 'customers', firebaseUser.uid), {
                    email: firebaseUser.email,
                    name: parsed.customer.name || '',
                    phone: parsed.customer.phone || '',
                    role: 'customer',
                    createdAt: new Date(),
                    status: 'active'
                  });
                  
                  const userObj: User = {
                    id: firebaseUser.uid,
                    email: firebaseUser.email!,
                    role: 'customer',
                    name: parsed.customer.name,
                    phone: parsed.customer.phone
                  };
                  
                  setUser(userObj);
                  localStorage.setItem('user', JSON.stringify(userObj));
                  console.log('✅ New customer document created');
                  return;
                }
              }
              
              // If still not found, log out
              console.error('❌ User document not found in Firestore');
              await signOut(auth);
              setUser(null);
              localStorage.removeItem('user');
              localStorage.removeItem('customerAuth');
            }
          }
          
        } catch (error) {
          console.error('❌ Error fetching user data:', error);
          await signOut(auth);
          setUser(null);
          localStorage.removeItem('user');
          localStorage.removeItem('customerAuth');
        }
      } else {
        // User signed out
        setUser(null);
        localStorage.removeItem('user');
        // NOTE: customerAuth remove nahi karein for customer portal access
        console.log('❌ User signed out');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // UPDATED: Added isCustomer parameter
  const login = async (email: string, password: string, isCustomer: boolean = false): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      console.log('🔑 Login attempt for:', email, 'Customer:', isCustomer);
      
      // 1. Firebase Authentication se login
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Firebase auth successful');
      
      if (isCustomer) {
        // CUSTOMER LOGIN
        const customerDoc = await getDoc(doc(db, 'customers', userCredential.user.uid));
        
        if (!customerDoc.exists()) {
          throw new Error('Customer not found in database');
        }
        
        const customerData = customerDoc.data();
        console.log('📋 Customer data from Firestore:', customerData);
        
        const userObj: User = {
          id: userCredential.user.uid,
          email: userCredential.user.email!,
          role: 'customer',
          name: customerData.name,
          phone: customerData.phone
        };
        
        setUser(userObj);
        localStorage.setItem('user', JSON.stringify(userObj));
        localStorage.setItem('customerAuth', JSON.stringify({
          isAuthenticated: true,
          customer: userObj
        }));
        
        console.log('✅ Customer login successful');
        router.push('/customer/portal');
        
      } else {
        // ADMIN LOGIN (original logic)
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        
        if (!userDoc.exists()) {
          throw new Error('User not found in database');
        }
        
        const userData = userDoc.data();
        console.log('📋 User role from Firestore:', userData.role);
        
        const userObj: User = {
          id: userCredential.user.uid,
          email: userCredential.user.email!,
          role: userData.role || 'admin',
          branchId: userData.branchId,
          branchName: userData.branchName,
          name: userData.name
        };
        
        setUser(userObj);
        localStorage.setItem('user', JSON.stringify(userObj));
        console.log('✅ User state updated');
        
        if (userData.role === 'super_admin') {
          console.log('🚀 SUPER ADMIN → Redirecting to /super-admin');
          router.push('/super-admin');
        } else {
          console.log('🚀 ADMIN → Redirecting to /admin');
          router.push('/admin');
        }
      }
      
      setIsLoading(false);
      return true;
      
    } catch (error: any) {
      console.error('❌ Login error:', error.code, error.message);
      setIsLoading(false);
      
      let errorMessage = 'Login failed';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'User not found';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password';
      }
      
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      localStorage.removeItem('user');
      
      // Check if it was a customer logout
      if (user?.role === 'customer') {
        localStorage.removeItem('customerAuth');
        router.push('/customer/login');
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};