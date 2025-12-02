import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Profileservice } from '../ProfileService/profileservice';
import { AuthService } from '../../../core/services/auth';
import { CartService } from '../../../core/services/cart.service';
import { DownloadService } from '../../../core/services/download.service';
import { BookService } from '../../../core/services/book';
import { AuthorService } from '../../../core/services/author';
import { Cart, CartItem, Book } from '../../../core/models/cart.model';
import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-user-profile',
  standalone: false,
  templateUrl: './user-profile.html',
  styleUrls: ['./user-profile.css'],
})
export class UserProfile implements OnInit, OnDestroy {
  profileForm: FormGroup;          
  deleteForm: FormGroup;            
  addressForm: FormGroup;         
  editAddressForm: FormGroup;     
  passwordForm: FormGroup;         
  fieldForms: { [key: string]: FormGroup } = {}; 

  isLoading = false;              
  isDeleting = false;              
  isAddingAddress = false;        
  isUpdatingAddress = false;       
  isDeletingAddress = false;     
  isChangingPassword = false;       

  message = '';                 
  isError = false;               

  user: any = null;             

  isEditMode = false;             
  activeSection: string = 'profile'; 
  editingField: string | null = null; 

  showDeleteConfirm = false;       
  showAddAddressForm = false;     
  showDeleteAddressConfirm = false; 
  showChangePasswordForm = false;  

  editingAddressId: string | null = null;  
  addressIdToDelete: string | null = null;  

  // Cart and Orders
  cart: Cart | null = null;
  orders: any[] = [];
  isLoadingCart = false;
  isLoadingOrders = false;
  cartError: string | null = null;
  ordersError: string | null = null;

  // Library (Purchased Books)
  purchasedBooks: any[] = [];
  isLoadingLibrary = false;
  libraryError: string | null = null;
  downloadingBookId: string | null = null;

  // Author Application
  authorForm: FormGroup;
  showAuthorForm: boolean = false;
  isSubmittingAuthor: boolean = false;
  authorStatus: string | null = null; // 'pending', 'approved', 'rejected', null (not applied)
  isLoadingAuthorStatus: boolean = false;
  authorProfile: any = null;

  private messageTimer: any = null;
  private destroy$ = new Subject<void>();


  constructor(
    private fb: FormBuilder,         
    private profileService: Profileservice,
    private authService: AuthService,
    private router: Router,
    private cartService: CartService,
    private downloadService: DownloadService,
    private bookService: BookService,
    private authorService: AuthorService,
    private snackBar: MatSnackBar
  ) {
    this.profileForm = this.fb.group({
      FirstName: ['', [Validators.required]], 
      LastName: ['', [Validators.required]],   
      email: ['', [Validators.required, Validators.email]] 
    });

    this.deleteForm = this.fb.group({
      password: ['', [Validators.required]] 
    });

    // إنشاء نماذج العناوين
    this.addressForm = this.createAddressForm();     
    this.editAddressForm = this.createAddressForm();

    const passwordValidator = (control: any) => {
      if (!control.value) return null;
      const value = control.value;
      const hasUpperCase = /[A-Z]/.test(value);
      const hasLowerCase = /[a-z]/.test(value);
      const hasNumber = /\d/.test(value);
      const hasMinLength = value.length >= 8;
      return (!hasMinLength || !hasUpperCase || !hasLowerCase || !hasNumber) 
        ? { invalidPassword: true } 
        : null;
    };
    
    this.passwordForm = this.fb.group({
      old_password: ['', [Validators.required]],       
      new_password: ['', [Validators.required, passwordValidator]], 
      confirm_password: ['', [Validators.required]]     
    }, { validators: this.passwordMatchValidator.bind(this) }); 

    this.fieldForms['FirstName'] = this.fb.group({
      FirstName: ['', [Validators.required]]
    });
    this.fieldForms['LastName'] = this.fb.group({
      LastName: ['', [Validators.required]]
    });
    this.fieldForms['email'] = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    // Author application form
    this.authorForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      bio: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

 
  private createAddressForm(): FormGroup {
    return this.fb.group({
      label: ['', [Validators.required]],       
      fullName: ['', [Validators.required]],     
      phone: ['', [Validators.required]],       
      line1: ['', [Validators.required]],       
      line2: [''],                               
      city: ['', [Validators.required]],        
      state: ['', [Validators.required]],       
      country: ['', [Validators.required]],     
      postalCode: ['', [Validators.required]],  
      isDefault: [false]                         
    });
  }


  private validatePasswordStrength(control: any) {
    if (!control.value) return null;
    
    const value = control.value;
    const hasUpperCase = /[A-Z]/.test(value);  
    const hasLowerCase = /[a-z]/.test(value); 
    const hasNumber = /\d/.test(value);        
    const hasMinLength = value.length >= 8;     
    
    if (!hasMinLength || !hasUpperCase || !hasLowerCase || !hasNumber) {
      return { invalidPassword: true };
    }
    
    return null; 
  }

  ngOnInit() {
    this.loadProfile();
    // Check author status if user is authenticated
    if (this.authService.isAuthenticated()) {
      this.checkAuthorStatus();
    }
  }

  ngOnDestroy() {
    this.clearMessageTimer();
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadProfile() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading = true;
    this.message = '';
    this.isError = false;

    this.profileService.getProfile().subscribe({
      next: (res) => {
        this.user = res.user; 
        
        this.profileForm.patchValue({
          FirstName: res.user.FirstName,
          LastName: res.user.LastName,
          email: res.user.email
        });
        
        this.isLoading = false; 
      },
      error: (err) => {
        this.message = err?.error?.error || err?.message || 'فشل تحميل الملف الشخصي';
        this.isError = true;
        this.isLoading = false;
        this.startAutoCloseTimer();
        
        if (err.status === 401) {
          setTimeout(() => {
            this.authService.logout();
            this.router.navigate(['/login']);
          }, 2000);
        }
      }
    });
  }

  toggleEditMode() {
    if (this.isEditMode) {
      this.profileForm.patchValue({
        FirstName: this.user.FirstName,
        LastName: this.user.LastName,
        email: this.user.email
      });
    }
    this.isEditMode = !this.isEditMode;
  }

  startEditField(fieldName: string) {
    this.editingField = fieldName; 
    const currentValue = this.user[fieldName]; 
    this.fieldForms[fieldName].patchValue({ [fieldName]: currentValue });
  }

  cancelEditField() {
    this.editingField = null; 
  }

  saveField(fieldName: string) {
    const form = this.fieldForms[fieldName];
    
    if (!form.valid) {
      form.markAllAsTouched();
      return;
    }

    const newValue = form.get(fieldName)?.value;
    
    if (newValue === this.user[fieldName]) {
      this.editingField = null;
      return;
    }

    this.isLoading = true;
    this.message = '';
    this.isError = false;

    this.profileService.updateProfile({ [fieldName]: newValue }).subscribe({
      next: (res) => {
        if (res.user) {
          this.user = { ...this.user, ...res.user };
        }
        
        this.message = res.message || `تم تحديث ${fieldName} بنجاح`;
        this.isError = false;
        this.isLoading = false;
        this.startAutoCloseTimer();
        
        this.editingField = null; 
        
        if (fieldName === 'email') {
          setTimeout(() => {
            this.authService.logout();
            this.router.navigate(['/login']);
          }, 2000);
        }
      },
      error: (err) => {
        this.message = err?.error?.error || err?.message || `فشل تحديث ${fieldName}`;
        this.isError = true;
        this.isLoading = false;
        this.startAutoCloseTimer();
      }
    });
  }

  onUpdateProfile() {
    if (!this.profileForm.valid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const formData = this.profileForm.value;
    const updateData: any = {};

    if (formData.FirstName !== this.user.FirstName) {
      updateData.FirstName = formData.FirstName;
    }
    if (formData.LastName !== this.user.LastName) {
      updateData.LastName = formData.LastName;
    }
    if (formData.email !== this.user.email) {
      updateData.email = formData.email;
    }

    if (Object.keys(updateData).length === 0) {
      this.message = 'لم يتم اكتشاف أي تغييرات';
      this.isError = true;
      this.startAutoCloseTimer();
      return;
    }

    this.isLoading = true;
    this.message = '';
    this.isError = false;

    this.profileService.updateProfile(updateData).subscribe({
      next: (res) => {
        if (res.user) {
          this.user = { ...this.user, ...res.user };
        }
        
        this.message = res.message || 'تم تحديث الملف الشخصي بنجاح';
        this.isError = false;
        this.isLoading = false;
        this.startAutoCloseTimer();
        
        this.isEditMode = false; 
        
        if (updateData.email) {
          setTimeout(() => {
            this.authService.logout();
            this.router.navigate(['/login']);
          }, 2000);
        }
      },
      error: (err) => {
        this.message = err?.error?.error || err?.message || 'فشل تحديث الملف الشخصي';
        this.isError = true;
        this.isLoading = false;
        this.startAutoCloseTimer();
      }
    });
  }

  showDeleteConfirmation() {
    this.showDeleteConfirm = true; 
    this.deleteForm.reset(); 
  }

  cancelDelete() {
    this.showDeleteConfirm = false; 
    this.deleteForm.reset(); 
  }

  onDeleteAccount() {
    if (!this.deleteForm.valid) {
      this.deleteForm.markAllAsTouched();
      return;
    }

    this.isDeleting = true;
    this.message = '';
    this.isError = false;
    const password = this.deleteForm.get('password')?.value;

    this.profileService.deleteAccount(password).subscribe({
      next: (res) => {
        this.message = res.message || 'تم حذف الحساب بنجاح';
        this.isError = false;
        this.isDeleting = false;
        this.showDeleteConfirm = false;
        this.startAutoCloseTimer();
        
        setTimeout(() => {
          this.authService.logout();
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        this.message = err?.error?.error || err?.message || 'فشل حذف الحساب';
        this.isError = true;
        this.isDeleting = false;
        this.startAutoCloseTimer();
      }
    });
  }

  closeMessage() {
    this.clearMessageTimer(); 
    this.message = ''; 
    this.isError = false; 
    this.isLoading = false; 
  }

  private clearMessageTimer() {
    if (this.messageTimer) {
      clearTimeout(this.messageTimer); 
      this.messageTimer = null; 
    }
  }

  private startAutoCloseTimer() {
    this.clearMessageTimer(); 
    
    if (this.message && !this.isLoading) {
      this.messageTimer = setTimeout(() => {
        this.closeMessage(); 
      }, 4000);
    }
  }

  logout() {
    this.authService.logout(); 
    this.router.navigate(['/login']); 
  }

  setActiveSection(section: string) {
    this.activeSection = section;
    
    // Load data when switching to cart, orders, library, or author section
    if (section === 'cart') {
      this.loadCart();
    } else if (section === 'orders') {
      this.loadOrders();
    } else if (section === 'library') {
      this.loadLibrary();
    } else if (section === 'author') {
      this.checkAuthorStatus();
    }
  }

  // Load cart items
  loadCart(): void {
    if (this.cart) return; // Already loaded
    
    this.isLoadingCart = true;
    this.cartError = null;
    
    this.cartService.getCart()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.cart = response.data;
          this.isLoadingCart = false;
        },
        error: (error) => {
          console.error('Error loading cart:', error);
          this.cartError = error.error?.message || 'Error loading cart';
          this.isLoadingCart = false;
          this.cart = null;
        }
      });
  }

  // Load user orders
  loadOrders(): void {
    if (this.orders.length > 0) return; // Already loaded
    
    this.isLoadingOrders = true;
    this.ordersError = null;
    
    this.profileService.getUserOrders()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.orders = response.data?.orders || response.orders || [];
          this.isLoadingOrders = false;
        },
        error: (error) => {
          console.error('Error loading orders:', error);
          this.ordersError = error.error?.message || 'Error loading orders';
          this.isLoadingOrders = false;
          this.orders = [];
        }
      });
  }

  // Get book from cart item
  getBook(item: CartItem): Book | null {
    return typeof item.bookId === 'object' ? item.bookId as Book : null;
  }

  // Get item total
  getItemTotal(item: CartItem): number {
    return item.qty * item.priceAtAdd;
  }

  // Navigate to cart page
  goToCart(): void {
    this.router.navigate(['/cart']);
  }

  // Get status badge class
  getStatusBadgeClass(status: string): string {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower === 'delivered') return 'bg-success';
    if (statusLower === 'shipped') return 'bg-primary';
    if (statusLower === 'paid') return 'bg-info';
    if (statusLower === 'cancelled') return 'bg-danger';
    return 'bg-warning';
  }

  passwordMatchValidator(form: FormGroup): any {
    const newPassword = form.get('new_password'); 
    const confirmPassword = form.get('confirm_password'); 
    
    if (!newPassword || !confirmPassword) return null; 
    
    if (newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true }); 
      return { passwordMismatch: true };
    }
    
    confirmPassword.setErrors(null);
    return null;
  }

  showChangePassword() {
    this.showChangePasswordForm = true; 
    this.passwordForm.reset(); 
  }

  cancelChangePassword() {
    this.showChangePasswordForm = false; 
    this.passwordForm.reset(); 
  }

  onChangePassword() {
    if (!this.passwordForm.valid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isChangingPassword = true;
    this.message = '';
    this.isError = false;

    this.profileService.changePassword(this.passwordForm.value).subscribe({
      next: (res) => {
        this.message = res.message || 'تم تغيير كلمة المرور بنجاح';
        this.isError = false;
        this.isChangingPassword = false;
        this.showChangePasswordForm = false;
        this.passwordForm.reset();
        this.startAutoCloseTimer();
      },
      error: (err) => {
        this.message = err?.error?.error || err?.message || 'فشل تغيير كلمة المرور';
        this.isError = true;
        this.isChangingPassword = false;
        this.startAutoCloseTimer();
      }
    });
  }

  showAddAddress() {
    this.showAddAddressForm = true; 
    this.addressForm.reset(); 
    this.addressForm.patchValue({ isDefault: false }); 
  }

  cancelAddAddress() {
    this.showAddAddressForm = false; 
    this.addressForm.reset(); 
  }

  onAddAddress() {
    if (!this.addressForm.valid) {
      this.addressForm.markAllAsTouched();
      return;
    }

    this.isAddingAddress = true;
    this.message = '';
    this.isError = false;
    const addressData = this.buildAddressData(this.addressForm.value);

    this.profileService.addAddress(addressData).subscribe({
      next: (res) => {
        this.message = res.message || 'تم إضافة العنوان بنجاح';
        this.isError = false;
        this.isAddingAddress = false;
        this.showAddAddressForm = false;
        this.addressForm.reset();
        this.startAutoCloseTimer();
        
        this.loadProfile();
      },
      error: (err) => {
        this.message = err?.error?.error || err?.message || 'فشل إضافة العنوان';
        this.isError = true;
        this.isAddingAddress = false;
        this.startAutoCloseTimer();
      }
    });
  }

  showEditAddress(index: number) {
    const address = this.user.addresses[index]; 
    this.editingAddressId = address._id || address.id || index.toString();
    
    this.editAddressForm.patchValue({
      label: address.label || '',
      fullName: address.fullName || '',
      phone: address.phone || '',
      line1: address.line1 || '',
      line2: address.line2 || '',
      city: address.city || '',
      state: address.state || '',
      country: address.country || '',
      postalCode: address.postalCode || '',
      isDefault: address.isDefault || false
    });
  }

  cancelEditAddress() {
    this.editingAddressId = null; 
    this.editAddressForm.reset(); 
  }

  onUpdateAddress() {
    if (!this.editAddressForm.valid || !this.editingAddressId) {
      this.editAddressForm.markAllAsTouched();
      return;
    }

    this.isUpdatingAddress = true;
    this.message = '';
    this.isError = false;
    const addressData = this.buildAddressData(this.editAddressForm.value);
    
    const addressIndex = this.user.addresses.findIndex((addr: any) => 
      addr._id === this.editingAddressId || addr.id === this.editingAddressId
    );
    
    if (addressIndex !== -1) {
      addressData.addressIndex = addressIndex;
    }
    if (typeof this.editingAddressId === 'string' && this.editingAddressId !== addressIndex.toString()) {
      addressData.addressId = this.editingAddressId;
    }

    this.profileService.updateAddress(addressData).subscribe({
      next: (res) => {
        this.message = res.message || 'تم تحديث العنوان بنجاح';
        this.isError = false;
        this.isUpdatingAddress = false;
        this.editingAddressId = null;
        this.editAddressForm.reset();
        this.startAutoCloseTimer();
        
        this.loadProfile();
      },
      error: (err) => {
        this.message = err?.error?.error || err?.message || 'فشل تحديث العنوان';
        this.isError = true;
        this.isUpdatingAddress = false;
        this.startAutoCloseTimer();
      }
    });
  }

  showDeleteAddressModal(index: number) {
    const address = this.user.addresses[index]; 
    this.addressIdToDelete = address._id || address.id || index.toString();
    this.showDeleteAddressConfirm = true; 
  }

  cancelDeleteAddress() {
    this.addressIdToDelete = null; 
    this.showDeleteAddressConfirm = false; 
  }

  onDeleteAddress() {
    if (!this.addressIdToDelete) return;

    this.isDeletingAddress = true;
    this.message = '';
    this.isError = false;
    
    const addressIndex = this.user.addresses.findIndex((addr: any) => 
      addr._id === this.addressIdToDelete || addr.id === this.addressIdToDelete
    );

    const addressData: any = {};
    if (addressIndex !== -1) {
      addressData.addressIndex = addressIndex;
    }
    if (typeof this.addressIdToDelete === 'string' && this.addressIdToDelete !== addressIndex.toString()) {
      addressData.addressId = this.addressIdToDelete;
    }

    this.profileService.deleteAddress(addressData).subscribe({
      next: (res) => {
        this.message = res.message || 'تم حذف العنوان بنجاح';
        this.isError = false;
        this.isDeletingAddress = false;
        this.showDeleteAddressConfirm = false;
        this.addressIdToDelete = null;
        this.startAutoCloseTimer();
        
        this.loadProfile();
      },
      error: (err) => {
        this.message = err?.error?.error || err?.message || 'فشل حذف العنوان';
        this.isError = true;
        this.isDeletingAddress = false;
        this.startAutoCloseTimer();
      }
    });
  }

  private buildAddressData(formData: any): any {
    const addressData: any = {
      label: formData.label?.trim() || '',        
      fullName: formData.fullName?.trim() || '',  
      phone: formData.phone?.trim() || '',        
      line1: formData.line1?.trim() || '',        
      city: formData.city?.trim() || '',          
      state: formData.state?.trim() || '',        
      country: formData.country?.trim() || '',    
      postalCode: formData.postalCode?.trim() || '', 
      isDefault: formData.isDefault || false       
    };
    
    if (formData.line2?.trim()) {
      addressData.line2 = formData.line2.trim();
    }
    
    return addressData;
  }

  // Load library (purchased books)
  loadLibrary(): void {
    if (this.purchasedBooks.length > 0) return; // Already loaded
    
    this.isLoadingLibrary = true;
    this.libraryError = null;
    
    // First load orders to get purchased books
    this.profileService.getUserOrders()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const orders = response.data?.orders || response.orders || [];
          
          // Extract unique books from paid orders
          const purchasedBookMap = new Map<string, any>();
          
          orders.forEach((order: any) => {
            // Check if order payment status is 'paid'
            const isPaid = order.payment?.status?.toLowerCase() === 'paid' || 
                          order.status?.toLowerCase() === 'paid';
            
            if (isPaid && order.items && order.items.length > 0) {
              order.items.forEach((item: any) => {
                const bookId = typeof item.bookId === 'string' 
                  ? item.bookId 
                  : (item.bookId?._id || item.bookId?.id || item.book?._id || item.book?.id);
                
                if (bookId && !purchasedBookMap.has(bookId)) {
                  // Store book info - prefer populated book object if available
                  const book = item.book || item.bookId;
                  purchasedBookMap.set(bookId, {
                    bookId: bookId,
                    book: typeof book === 'object' ? book : null,
                    purchaseDate: order.placedAt || order.createdAt,
                    orderId: order._id || order.id
                  });
                }
              });
            }
          });
          
          // Convert map to array and fetch full book details for books without populated data
          const bookIds = Array.from(purchasedBookMap.keys());
          const booksToFetch: string[] = [];
          
          this.purchasedBooks = Array.from(purchasedBookMap.values()).map((item: any) => {
            if (!item.book) {
              booksToFetch.push(item.bookId);
            }
            return item;
          });
          
          // Fetch book details for books that weren't populated
          if (booksToFetch.length > 0) {
            const fetchPromises = booksToFetch.map(bookId => 
              firstValueFrom(this.bookService.getBookById(bookId))
            );
            
            Promise.all(fetchPromises).then((books: any[]) => {
              books.forEach((book: any, index: number) => {
                if (book) {
                  const item = this.purchasedBooks.find((p: any) => p.bookId === booksToFetch[index]);
                  if (item) {
                    item.book = book;
                  }
                }
              });
            }).catch((error) => {
              console.error('Error fetching book details:', error);
            });
          }
          
          this.isLoadingLibrary = false;
        },
        error: (error) => {
          console.error('Error loading library:', error);
          this.libraryError = error.error?.message || 'Error loading library';
          this.isLoadingLibrary = false;
          this.purchasedBooks = [];
        }
      });
  }

  // Download a purchased book
  downloadBook(bookId: string, bookTitle: string = 'book'): void {
    if (this.downloadingBookId === bookId) return; // Already downloading
    
    this.downloadingBookId = bookId;
    this.snackBar.open('Preparing download...', '', {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
    
    this.downloadService.downloadBook(bookId).subscribe({
      next: (blob: Blob) => {
        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${bookTitle.replace(/[^a-z0-9]/gi, '_')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        this.snackBar.open('Download started!', '', {
          duration: 2000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        
        this.downloadingBookId = null;
      },
      error: (error) => {
        console.error('Error downloading book:', error);
        const errorMsg = error.error?.message || error.message || 'Failed to download book';
        this.snackBar.open(`Download failed: ${errorMsg}`, 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        this.downloadingBookId = null;
      }
    });
  }

  // Check if a book is being downloaded
  isDownloading(bookId: string): boolean {
    return this.downloadingBookId === bookId;
  }

  // Get book title from purchased book item
  getBookTitle(item: any): string {
    if (item.book && item.book.title) {
      return item.book.title;
    }
    return 'Unknown Book';
  }

  // Get book image from purchased book item
  getBookImage(item: any): string {
    if (item.book && item.book.image && item.book.image.url) {
      return item.book.image.url;
    }
    return 'https://res.cloudinary.com/dbelkcsrq/image/upload/book-store/covers/soul.jpg';
  }

  // Check author status
  checkAuthorStatus(): void {
    if (!this.authService.isAuthenticated()) {
      this.authorStatus = null;
      return;
    }

    this.isLoadingAuthorStatus = true;
    this.authorService.getMyAuthorProfile().subscribe({
      next: (author) => {
        if (author) {
          this.authorProfile = author;
          this.authorStatus = author.status || 'pending';
          
          // Pre-fill form if user has already applied
          if (author.name || author.bio) {
            this.authorForm.patchValue({
              name: author.name || '',
              bio: author.bio || ''
            });
          }
        } else {
          this.authorStatus = null;
          this.authorProfile = null;
        }
        this.isLoadingAuthorStatus = false;
      },
      error: (error) => {
        // 404 means user hasn't applied yet, which is fine
        if (error.status === 404) {
          this.authorStatus = null;
          this.authorProfile = null;
        } else {
          console.error('Error checking author status:', error);
        }
        this.isLoadingAuthorStatus = false;
      }
    });
  }

  // Show author application form
  showAuthorApplicationForm(): void {
    if (this.authorStatus === 'approved') {
      this.snackBar.open('You are already an approved author!', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      return;
    }

    if (this.authorStatus === 'pending') {
      this.snackBar.open('Your author application is pending review', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      return;
    }

    this.showAuthorForm = true;
  }

  // Cancel author form
  cancelAuthorForm(): void {
    this.showAuthorForm = false;
    // Reset form to current author profile if exists
    if (this.authorProfile) {
      this.authorForm.patchValue({
        name: this.authorProfile.name || '',
        bio: this.authorProfile.bio || ''
      });
    } else {
      this.authorForm.reset();
    }
  }

  // Submit author application
  submitAuthorApplication(): void {
    if (!this.authorForm.valid) {
      this.authorForm.markAllAsTouched();
      return;
    }

    this.isSubmittingAuthor = true;
    const formData = this.authorForm.value;

    this.authorService.applyAsAuthor(formData.name.trim(), formData.bio.trim()).subscribe({
      next: (response) => {
        this.snackBar.open('Author application submitted successfully! It will be reviewed by an admin.', 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        this.showAuthorForm = false;
        this.isSubmittingAuthor = false;
        
        // Reload author status
        this.checkAuthorStatus();
      },
      error: (error) => {
        console.error('Error submitting author application:', error);
        const errorMsg = error.error?.error || error.error?.message || error.message || 'Failed to submit author application';
        this.snackBar.open(errorMsg, 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        this.isSubmittingAuthor = false;
      }
    });
  }

  // Get author status badge class
  getAuthorStatusBadgeClass(status: string | null): string {
    if (!status) return 'bg-secondary';
    const statusLower = status.toLowerCase();
    if (statusLower === 'approved') return 'bg-success';
    if (statusLower === 'pending') return 'bg-warning text-dark';
    if (statusLower === 'rejected') return 'bg-danger';
    if (statusLower === 'revoked') return 'bg-danger';
    return 'bg-secondary';
  }

  // Get author status text
  getAuthorStatusText(status: string | null): string {
    if (!status) return 'Not Applied';
    const statusLower = status.toLowerCase();
    if (statusLower === 'approved') return 'Approved';
    if (statusLower === 'pending') return 'Pending Review';
    if (statusLower === 'rejected') return 'Rejected';
    if (statusLower === 'revoked') return 'Revoked';
    return status;
  }

  // Navigate to author profile if approved
  goToAuthorProfile(): void {
    if (this.authorStatus === 'approved' && this.authorProfile) {
      this.router.navigate(['/author-profile']);
    }
  }

}
