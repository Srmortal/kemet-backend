import { UserService } from "@features/user/user.service";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

const mockUser = {
  id: "user-123",
  email: "test@example.com",
  displayName: "Test User",
  avatar: "https://example.com/avatar.jpg",
  roles: ["user"],
  isActive: true,
  username: "testuser",
  createdAt: "2023-01-01",
};
describe("UserService", () => {
  let userRepository;
  let userService;
  beforeEach(() => {
    userRepository = {
      getById: jest.fn(),
    };
    userService = new UserService(userRepository);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it("returns ok result with user if found", async () => {
    userRepository.getById.mockResolvedValue(mockUser);
    const result = await userService.getUserProfileService("user-123");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toMatchObject({
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
      });
    }
  });
  it("returns err result if user not found", async () => {
    userRepository.getById.mockResolvedValue(null);
    const result = await userService.getUserProfileService("user-404");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatchObject({ type: "NotFound" });
    }
  });
  it("never throws errors", async () => {
    userRepository.getById.mockImplementation(() => {
      throw new Error("fail");
    });
    const result = await userService.getUserProfileService("user-err");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatchObject({ type: "Unknown" });
    }
  });
});
//# sourceMappingURL=user.service.test.js.map
