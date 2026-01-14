// // contexts/CustomerAuthContext.tsx
// 'use client';

// import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// import { useRouter } from 'next/navigation';
// import { 
//   signInWithEmailAndPassword,
//   createUserWithEmailAndPassword,
//   signOut,
//   onAuthStateChanged,
//   User as FirebaseUser
// } from 'firebase/auth';
// import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
// import { auth, db } from '@/lib/firebase';

// interface Customer {
//   uid: string;
//   email: string;
//   name: string;
//   phone: string;
//   dateOfBirth: string;
//   role: 'customer';
//   status: 'active';
//   createdAt?: any;
// }

// interface CustomerAuthContextType {
//   customer: Customer | null;
//   login: (email: string, password: string) => Promise<boolean>;
//   register: (data: {
//     name: string;
//     email: string;
//     phone: string;
//     password: string;
//     dateOfBirth: string;
//   }) => Promise<boolean>;
//   logout: () => Promise<void>;
//   isLoading: boolean;
// }

// const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

// export const useCustomerAuth = () => {
//   const context = useContext(CustomerAuthContext);
//   if (context === undefined) {
//     throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
//   }
//   return context;
// };

// interface CustomerAuthProviderProps {
//   children: ReactNode;
// }

// export const CustomerAuthProvider: React.FC<CustomerAuthProviderProps> = ({ children }) => {
//   const [customer, setCustomer] = useState<Customer | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const router = useRouter();

//   useEffect(() => {
//     // Check localStorage first for faster loading
//     const storedCustomer = localStorage.getItem('customerAuth');
//     if (storedCustomer) {
//       try {
//         const parsed = JSON.parse(storedCustomer);
//         if (parsed.isAuthenticated && parsed.customer) {
//           setCustomer(parsed.customer);
//         }
//       } catch (error) {
//         console.error('Error parsing stored customer:', error);
//       }
//     }

//     // Then check Firebase auth state
//     const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
//       if (firebaseUser) {
//         try {
//           const customerDoc = await getDoc(doc(db, 'customers', firebaseUser.uid));
          
//           if (customerDoc.exists()) {
//             const customerData = customerDoc.data();
//             const customerObj: Customer = {
//               uid: firebaseUser.uid,
//               email: firebaseUser.email!,
//               name: customerData.name || 'Customer',
//               phone: customerData.phone || '',
//               dateOfBirth: customerData.dateOfBirth || '',
//               role: 'customer',
//               status: customerData.status || 'active',
//               createdAt: customerData.createdAt
//             };
            
//             setCustomer(customerObj);
//             localStorage.setItem('customerAuth', JSON.stringify({
//               isAuthenticated: true,
//               customer: customerObj
//             }));
//           } else {
//             // If customer document doesn't exist in customers collection, check users collection
//             const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
//             if (userDoc.exists()) {
//               const userData = userDoc.data();
//               if (userData.role === 'customer') {
//                 // Create customer document from user data
//                 const customerObj: Customer = {
//                   uid: firebaseUser.uid,
//                   email: firebaseUser.email!,
//                   name: userData.name || 'Customer',
//                   phone: userData.phone || '',
//                   dateOfBirth: userData.dateOfBirth || '',
//                   role: 'customer',
//                   status: userData.status || 'active',
//                   createdAt: userData.createdAt
//                 };
                
//                 setCustomer(customerObj);
//                 localStorage.setItem('customerAuth', JSON.stringify({
//                   isAuthenticated: true,
//                   customer: customerObj
//                 }));
//               } else {
//                 // Not a customer, sign out
//                 await signOut(auth);
//                 setCustomer(null);
//                 localStorage.removeItem('customerAuth');
//               }
//             } else {
//               // No document found, sign out
//               await signOut(auth);
//               setCustomer(null);
//               localStorage.removeItem('customerAuth');
//             }
//           }
//         } catch (error) {
//           console.error('Error fetching customer data:', error);
//           setCustomer(null);
//           localStorage.removeItem('customerAuth');
//         }
//       } else {
//         setCustomer(null);
//         localStorage.removeItem('customerAuth');
//       }
//       setIsLoading(false);
//     });

//     return () => unsubscribe();
//   }, []);

//   const login = async (email: string, password: string): Promise<boolean> => {
//     setIsLoading(true);
//     try {
//       const userCredential = await signInWithEmailAndPassword(auth, email, password);
//       const firebaseUser = userCredential.user;

//       // Check customers collection first
//       let customerDoc = await getDoc(doc(db, 'customers', firebaseUser.uid));
      
//       if (!customerDoc.exists()) {
//         // Check users collection
//         const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
//         if (!userDoc.exists() || userDoc.data()?.role !== 'customer') {
//           throw new Error('Customer account not found');
//         }
        
//         // Create customer document from user data
//         const userData = userDoc.data();
//         await setDoc(doc(db, 'customers', firebaseUser.uid), {
//           uid: firebaseUser.uid,
//           email: firebaseUser.email,
//           name: userData.name,
//           phone: userData.phone || '',
//           dateOfBirth: userData.dateOfBirth || '',
//           role: 'customer',
//           status: 'active',
//           createdAt: userData.createdAt || serverTimestamp(),
//           updatedAt: serverTimestamp()
//         });
        
//         customerDoc = await getDoc(doc(db, 'customers', firebaseUser.uid));
//       }

//       const customerData = customerDoc.data();
//       const customerObj: Customer = {
//         uid: firebaseUser.uid,
//         email: firebaseUser.email!,
//         name: customerData.name || 'Customer',
//         phone: customerData.phone || '',
//         dateOfBirth: customerData.dateOfBirth || '',
//         role: 'customer',
//         status: customerData.status || 'active',
//         createdAt: customerData.createdAt
//       };

//       setCustomer(customerObj);
//       localStorage.setItem('customerAuth', JSON.stringify({
//         isAuthenticated: true,
//         customer: customerObj
//       }));

//       router.push('/customer/portal');
//       return true;
//     } catch (error: any) {
//       console.error('Login error:', error);
//       throw error;
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const register = async (data: {
//     name: string;
//     email: string;
//     phone: string;
//     password: string;
//     dateOfBirth: string;
//   }): Promise<boolean> => {
//     setIsLoading(true);
//     try {
//       // 1. Create user in Firebase Authentication
//       const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
//       const firebaseUser = userCredential.user;

//       // 2. Create document in customers collection
//       const customerData = {
//         uid: firebaseUser.uid,
//         email: data.email,
//         name: data.name,
//         phone: data.phone,
//         dateOfBirth: data.dateOfBirth,
//         role: 'customer',
//         status: 'active',
//         createdAt: serverTimestamp(),
//         updatedAt: serverTimestamp()
//       };

//       await setDoc(doc(db, 'customers', firebaseUser.uid), customerData);

//       // 3. Also create in users collection for backward compatibility
//       await setDoc(doc(db, 'users', firebaseUser.uid), {
//         ...customerData,
//         role: 'customer'
//       });

//       const customerObj: Customer = {
//         uid: firebaseUser.uid,
//         email: data.email,
//         name: data.name,
//         phone: data.phone,
//         dateOfBirth: data.dateOfBirth,
//         role: 'customer',
//         status: 'active'
//       };

//       setCustomer(customerObj);
//       localStorage.setItem('customerAuth', JSON.stringify({
//         isAuthenticated: true,
//         customer: customerObj
//       }));

//       router.push('/customer/portal');
//       return true;
//     } catch (error: any) {
//       console.error('Registration error:', error);
//       throw error;
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const logout = async () => {
//     try {
//       await signOut(auth);
//       setCustomer(null);
//       localStorage.removeItem('customerAuth');
//       router.push('/customer-login');
//     } catch (error) {
//       console.error('Logout error:', error);
//     }
//   };

//   const value: CustomerAuthContextType = {
//     customer,
//     login,
//     register,
//     logout,
//     isLoading,
//   };

//   return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>;
// };