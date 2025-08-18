interface User {
  id: string;
  name: string;
  email: string; // Email is now mandatory
}

const USER_STORAGE_KEY = 'diagram_app_user';
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

export class UserService {
  private static instance: UserService;
  private currentUser: User | null = null;

  private constructor() {
    this.loadUserFromStorage();
  }

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  private loadUserFromStorage(): void {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      if (stored) {
        const user = JSON.parse(stored);
        // Basic validation to ensure the stored user has an email
        if (user && user.email) {
          this.currentUser = user;
        } else {
          this.clearUser(); // Clear invalid user data
        }
      }
    } catch (error) {
      console.error('Failed to load user from storage:', error);
      this.clearUser();
    }
  }

  private saveUserToStorage(user: User): void {
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to save user to storage:', error);
    }
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public async loginOrRegister(email: string, name?: string): Promise<User | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          name: name?.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to login or register');
      }

      const user: User = await response.json();

      this.currentUser = user;
      this.saveUserToStorage(user);

      return user;
    } catch (error) {
      console.error('Login or register error:', error);
      this.clearUser();
      return null;
    }
  }

  public updateUser(updates: Partial<Omit<User, 'id'>>): User | null {
    if (!this.currentUser) return null;

    const updatedUser = {
      ...this.currentUser,
      ...updates,
    };

    this.currentUser = updatedUser;
    this.saveUserToStorage(updatedUser);
    return updatedUser;
  }

  public clearUser(): void {
    this.currentUser = null;
    localStorage.removeItem(USER_STORAGE_KEY);
  }

  public isLoggedIn(): boolean {
    return this.currentUser !== null;
  }

  public async promptForUser(): Promise<User | null> {
    const email = prompt('Please enter your email to continue:');
    if (!email || email.trim() === '') {
      return null;
    }

    // Optional: ask for name only if user is new, but for simplicity, we can always ask
    const name = prompt('Enter your name (optional):');

    return await this.loginOrRegister(email, name || undefined);
  }
}

export const userService = UserService.getInstance();