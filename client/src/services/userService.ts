interface User {
  id: string;
  name: string;
  email?: string;
}

const USER_STORAGE_KEY = 'diagram_app_user';

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
        this.currentUser = JSON.parse(stored);
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

  public setUser(name: string, email?: string): User {
    const user: User = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      email: email?.trim(),
    };

    this.currentUser = user;
    this.saveUserToStorage(user);
    return user;
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

  public promptForUser(): User | null {
    const name = prompt('Please enter your name to continue:');
    if (!name || name.trim() === '') {
      return null;
    }

    const email = prompt('Email (optional):');
    return this.setUser(name, email || undefined);
  }
}

export const userService = UserService.getInstance();