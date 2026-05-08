import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { PrismaService } from "../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";
import * as bcrypt from "bcrypt";

jest.mock("bcrypt");

describe("AuthService", () => {
  let service: AuthService;
  let prisma: DeepMockProxy<PrismaService>;
  let jwtService: DeepMockProxy<JwtService>;

  const mockUser = {
    id: 1,
    email: "test@example.com",
    password: "hashedpassword",
    name: "Test User",
    avatar: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = mockDeep<PrismaService>();
    jwtService = mockDeep<JwtService>();

    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(mockUser as any);
    jwtService.sign.mockReturnValue("mock-jwt-token");

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("validateUser", () => {
    it("should return user without password when credentials are valid", async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser("test@example.com", "password123");

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith("password123", "hashedpassword");
      expect(result).toEqual({
        id: 1,
        email: "test@example.com",
        name: "Test User",
        avatar: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it("should return null when user does not exist", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser("nonexistent@example.com", "password");

      expect(result).toBeNull();
    });

    it("should return null when password is incorrect", async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser("test@example.com", "wrongpassword");

      expect(result).toBeNull();
    });
  });

  describe("login", () => {
    it("should return access token and user info", async () => {
      const user = { id: 1, email: "test@example.com", name: "Test User" };

      const result = await service.login(user);

      expect(jwtService.sign).toHaveBeenCalledWith({
        email: "test@example.com",
        sub: 1,
      });
      expect(result).toEqual({
        access_token: "mock-jwt-token",
        user: { id: 1, email: "test@example.com", name: "Test User" },
      });
    });
  });

  describe("register", () => {
    it("should register a new user", async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashedpassword");

      const dto = {
        email: "new@example.com",
        password: "password123",
        name: "New User",
        avatar: null,
      };

      const result = await service.register(dto as any);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "new@example.com" },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: "new@example.com",
          password: "hashedpassword",
          name: "New User",
        }),
      });
      expect(result).toEqual({
        id: 1,
        email: "test@example.com",
        name: "Test User",
        avatar: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it("should throw ConflictException when email already exists", async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser as any);

      const dto = {
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      };

      await expect(service.register(dto as any)).rejects.toThrow(ConflictException);
    });
  });

  describe("getProfile", () => {
    it("should return user profile", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: "test@example.com",
        name: "Test User",
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await service.getProfile(1);

      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          select: expect.objectContaining({
            id: true,
            email: true,
          }),
        }),
      );
      expect(result).toBeDefined();
    });

    it("should throw UnauthorizedException when user does not exist", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile(999)).rejects.toThrow(UnauthorizedException);
    });
  });
});
