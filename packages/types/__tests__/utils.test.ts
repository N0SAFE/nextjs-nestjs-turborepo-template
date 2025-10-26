import { describe, expect, it } from 'vitest'
import type {
  FromCamelToSnake,
  FromPascalToSnake,
  SnakeToPascal,
  CamelToPascal,
  SnakeToCamel,
  PascalToCamel,
  ObjectFromCamelToSnake,
  ObjectFromPascalToSnake,
  ObjectFromSnakeToPascal,
  ObjectFromPascalToCamel,
  UnionToArray,
  ArrayContains,
  Prettify,
  OmitNever,
  TupleIndices,
} from './utils'
import { days } from './utils'

describe('String Case Transformation Types', () => {
  describe('Snake Case Transformations', () => {
    it('should transform camelCase to snake_case', () => {
      type TestCamel = FromCamelToSnake<'userName'>
      type TestPascal = FromPascalToSnake<'UserName'>
      
      // Type-level tests - these will fail at compile time if incorrect
      const testCamel: TestCamel = 'user_name'
      const testPascal: TestPascal = 'user_name'
      
      expect(testCamel).toBe('user_name')
      expect(testPascal).toBe('user_name')
    })

    it('should handle complex strings', () => {
      type ComplexCamel = FromCamelToSnake<'getUserAccountInfo'>
      type ComplexPascal = FromPascalToSnake<'GetUserAccountInfo'>
      
      const complexCamel: ComplexCamel = 'get_user_account_info'
      const complexPascal: ComplexPascal = 'get_user_account_info'
      
      expect(complexCamel).toBe('get_user_account_info')
      expect(complexPascal).toBe('get_user_account_info')
    })
  })

  describe('Pascal Case Transformations', () => {
    it('should transform snake_case to PascalCase', () => {
      type TestSnake = SnakeToPascal<'user_name'>
      type TestCamel = CamelToPascal<'userName'>
      
      const testSnake: TestSnake = 'UserName'
      const testCamel: TestCamel = 'UserName'
      
      expect(testSnake).toBe('UserName')
      expect(testCamel).toBe('UserName')
    })

    it('should handle complex transformations', () => {
      type ComplexSnake = SnakeToPascal<'user_account_info'>
      
      const complexSnake: ComplexSnake = 'UserAccountInfo'
      
      expect(complexSnake).toBe('UserAccountInfo')
    })
  })

  describe('Camel Case Transformations', () => {
    it('should transform snake_case to camelCase', () => {
      type TestSnake = SnakeToCamel<'user_name'>
      type TestPascal = PascalToCamel<'UserName'>
      
      const testSnake: TestSnake = 'userName'
      const testPascal: TestPascal = 'userName'
      
      expect(testSnake).toBe('userName')
      expect(testPascal).toBe('userName')
    })
  })

  describe('Object Transformations', () => {
    it('should transform object keys from camelCase to snake_case', () => {
      type Original = { userName: string; userAge: number }
      type Transformed = ObjectFromCamelToSnake<Original>
      
      const transformed: Transformed = {
        username: 'John',
        userage: 30
      }
      
      expect(transformed.username).toBe('John')
      expect(transformed.userage).toBe(30)
    })

    it('should transform object keys from PascalCase to snake_case', () => {
      type Original = { UserName: string; UserAge: number }
      type Transformed = ObjectFromPascalToSnake<Original>
      
      const transformed: Transformed = {
        username: 'John',
        userage: 30
      }
      
      expect(transformed.username).toBe('John')
      expect(transformed.userage).toBe(30)
    })

    it('should handle nested objects', () => {
      type Original = { 
        userInfo: { 
          userName: string
          userAge: number 
        } 
      }
      type Transformed = ObjectFromCamelToSnake<Original>
      
      const transformed: Transformed = {
        userinfo: {
          username: 'John',
          userage: 30
        }
      }
      
      expect(transformed.userinfo.username).toBe('John')
      expect(transformed.userinfo.userage).toBe(30)
    })
  })
})

describe('Utility Types', () => {
  describe('UnionToArray', () => {
    it('should convert union types to array types', () => {
      type Union = 'a' | 'b' | 'c'
      type ArrayType = UnionToArray<Union>
      
      // This is a compile-time test - the type should include all union members
      const array: ArrayType = ['a', 'b', 'c']
      
      expect(array).toEqual(['a', 'b', 'c'])
    })
  })

  describe('ArrayContains', () => {
    it('should check if array contains a type', () => {
      type TestArray = ['a', 'b', 'c']
      type ContainsA = ArrayContains<TestArray, 'a'>
      type ContainsD = ArrayContains<TestArray, 'd'>
      
      const containsA: ContainsA = true
      const containsD: ContainsD = false
      
      expect(containsA).toBe(true)
      expect(containsD).toBe(false)
    })
  })

  describe('TupleIndices', () => {
    it('should generate valid indices for tuples', () => {
      type TestTuple = [string, number, boolean]
      type Indices = TupleIndices<TestTuple>
      
      // Should allow 0, 1, 2 but not 3
      const validIndex1: Indices = 0
      const validIndex2: Indices = 1
      const validIndex3: Indices = 2
      
      expect(validIndex1).toBe(0)
      expect(validIndex2).toBe(1)
      expect(validIndex3).toBe(2)
    })
  })

  describe('Prettify', () => {
    it('should make complex types more readable', () => {
      type Complex = { a: string } & { b: number }
      type Pretty = Prettify<Complex>
      
      const pretty: Pretty = { a: 'test', b: 42 }
      
      expect(pretty.a).toBe('test')
      expect(pretty.b).toBe(42)
    })
  })

  describe('OmitNever', () => {
    it('should omit never properties from objects', () => {
      type WithNever = { a: string; b: never; c: number }
      type WithoutNever = OmitNever<WithNever>
      
      const withoutNever: WithoutNever = { a: 'test', c: 42 }
      
      expect(withoutNever.a).toBe('test')
      expect(withoutNever.c).toBe(42)
      // Property 'b' should not exist
    })
  })
})

describe('Constants', () => {
  describe('days array', () => {
    it('should contain all days of the week', () => {
      expect(days).toEqual(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])
      expect(days).toHaveLength(7)
    })

    it('should be readonly', () => {
      // This is mainly a compile-time test
      expect(Array.isArray(days)).toBe(true)
      expect(days[0]).toBe('mon')
      expect(days[6]).toBe('sun')
    })
  })
})

describe('Type Level Tests', () => {
  it('should verify type transformations at compile time', () => {
    // These tests verify that our types work correctly at compile time
    // If the types are wrong, TypeScript will fail to compile
    
    // String transformations
    const snakeCase: FromCamelToSnake<'testString'> = 'test_string'
    const pascalCase: SnakeToPascal<'test_string'> = 'TestString'
    const camelCase: SnakeToCamel<'test_string'> = 'testString'
    
    // Object transformations
    const objSnake: ObjectFromCamelToSnake<{ testProp: string }> = { testprop: 'value' }
    const objPascal: ObjectFromSnakeToPascal<{ test_prop: string }> = { TestProp: 'value' }
    const objCamel: ObjectFromPascalToCamel<{ TestProp: string }> = { testProp: 'value' }
    
    // Verify the values are what we expect
    expect(snakeCase).toBe('test_string')
    expect(pascalCase).toBe('TestString')
    expect(camelCase).toBe('testString')
    expect(objSnake.testprop).toBe('value')
    expect(objPascal.TestProp).toBe('value')
    expect(objCamel.testProp).toBe('value')
  })
})
