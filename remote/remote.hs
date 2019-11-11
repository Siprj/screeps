#!/usr/bin/env stack
-- stack --resolver lts-14.13 --install-ghc runghc --package wreq --package aeson --package text --package filemanip --package directory --package filepath --package lens --package bytestring --package containers --package optparse-applicative --package aeson-pretty
{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE RecordWildCards #-}
{-# LANGUAGE TemplateHaskell #-}

module Main where

import Control.Exception
import Control.Lens hiding ((.=))
import Control.Monad
import Data.Aeson
import Data.Aeson.TH
import Data.Aeson.Types (Pair)
import Data.Aeson.Encode.Pretty (encodePretty)
import qualified Data.ByteString.Char8 as BS
import qualified Data.ByteString.Lazy.Char8 as BSL
import Data.Map
import Data.Monoid
import Data.Text hiding (find)
import qualified Data.Text as T
import Data.Text.Encoding (encodeUtf8)
import Network.Wreq (auth, postWith, defaults)
import qualified Network.Wreq as W
import Options.Applicative
    ( (<**>)
    , Parser
    , auto
    , execParser
    , fullDesc
    , header
    , help
    , helper
    , info
    , info
    , long
    , metavar
    , option
    , progDesc
    , short
    , showDefault
    , switch
    , value
    )
import System.Directory
    ( getCurrentDirectory
    , getXdgDirectory
    , withCurrentDirectory
    , XdgDirectory(XdgConfig)
    )
import System.Environment
import System.FilePath
import System.FilePath.Find
import System.IO


type Token = Text
data Tokens = Tokens (Map Text Token)

$(deriveJSON defaultOptions ''Tokens)

data Protocol = Http | Https

$(deriveJSON defaultOptions ''Protocol)

data ConfigurationBit = ConfigurationBit
    { baseUrl :: String
    , destinationBranch :: Text
    }

$(deriveJSON defaultOptions ''ConfigurationBit)

data Configuration = Configuration (Map Text ConfigurationBit)

$(deriveJSON defaultOptions ''Configuration)

data StringException = StringException String
  deriving (Show)

instance Exception StringException

-- Configuration
artefactDirectory = "dist"
tokenConfigFileName = "screeps-remote-tokens.json"
configFileName = "screeps-remote.json"

data CmdOptions = CmdOptions
    { templateConfigurationFile :: Bool
    , templateTokenFile :: Bool
    , remoteName :: Text
    }

cmdOptions :: Parser CmdOptions
cmdOptions = CmdOptions
      <$> switch
          ( long "template-cfg"
         <> short 'c'
         <> help "Print template configuration file")
      <*> switch
          ( long "template-token"
         <> short 't'
         <> help "Print template token file")
      <*> option auto
          ( long "remote"
         <> short 'r'
         <> help "Which remote to use"
         <> showDefault
         <> value "main"
         <> metavar "REMOTE")

main :: IO ()
main = do
    CmdOptions{..} <- execParser opts
    when templateConfigurationFile printConfigFileTemplate
    when templateTokenFile printTokenFileTemplate
    if templateConfigurationFile || templateTokenFile
       then pure ()
       else doPush remoteName
  where
    opts = info (cmdOptions <**> helper)
      ( fullDesc
     <> progDesc "Push sources to screeps server"
     <> header "kwakwa" )

printConfigFileTemplate :: IO ()
printConfigFileTemplate = do
    BSL.putStrLn . encodePretty . Configuration $ fromList
        [ ("main", ConfigurationBit "https://screeps.com" "main" )
        , ("main-dev", ConfigurationBit "https://screeps.com" "dev" )
        , ("local", ConfigurationBit "http://localhost" "main" )
        ]

printTokenFileTemplate :: IO ()
printTokenFileTemplate = do
    BSL.putStrLn . encodePretty . Tokens $ fromList
        [ ("main", "token1" )
        , ("main-dev", "token2" )
        , ("local", "token3" )
        ]

doPush :: Text -> IO ()
doPush remoteName = do
    (ConfigurationBit{..}, token) <- readConfigurationFiles >>= getRelevantConfiguration
    print $ "Destination branch: " <> destinationBranch
    curDir <- getCurrentDirectory
    jss <- findJs $ curDir </> artefactDirectory
    modules <- mapM (fileToModule $ curDir </> artefactDirectory) jss
    sendPost baseUrl token $ SourcePushReq destinationBranch modules
  where
    getRelevantConfiguration :: (Configuration, Tokens) -> IO (ConfigurationBit, Token)
    getRelevantConfiguration (Configuration configs, Tokens tokeConfigs) = do
        confiBit <- maybe throwMissingConfig pure $ configs !? remoteName
        token <- maybe throwMissingToken pure $ tokeConfigs !? remoteName
        pure (confiBit, token)
      where
        throwMissingConfig = throwIO . StringException $ "Remote \""
            <> T.unpack remoteName
            <> "\" is missing in configuration file ("
            <> configFileName
            <> ")."
        throwMissingToken =  throwIO . StringException $ "Remote \""
            <> T.unpack remoteName
            <> "\" is missing a token in file (~/.config/"
            <> tokenConfigFileName
            <> ")."

readConfigurationFiles :: IO (Configuration, Tokens)
readConfigurationFiles = do
    configFile <- fmap (</> configFileName) getCurrentDirectory
    configContent <- BSL.readFile configFile
    cfg <- either (throwIO . StringException) pure $ eitherDecode configContent
    tokenFile <- getXdgDirectory XdgConfig tokenConfigFileName
    tokensContent <- BSL.readFile tokenFile
    tokens <- either (throwIO . StringException) pure $ eitherDecode tokensContent
    pure (cfg, tokens)

sendPost :: String -> Token -> SourcePushReq -> IO ()
sendPost baseUrl token reqData = do
    let opts = defaults & W.header "X-Token" .~ [encodeUtf8 token]
    void . postWith opts (baseUrl <> "/api/user/code") $ toJSON reqData

getUserNameAndPassword :: IO (String, String)
getUserNameAndPassword = do
    userName <- lookupEnv "SCREEPS_USER" >>= maybe getUserName return
    password <- lookupEnv "SCREEPS_PASSWORD" >>= maybe getPassword return
    return (userName, password)
  where
    getUserName = do
        putStrLn "Type user name or email:"
        getLine
    getPassword = do
        putStrLn "Type password:"
        withoutEcho getLine

withoutEcho :: IO a -> IO a
withoutEcho action = do
    old <- hGetEcho stdin
    bracket_ (hSetEcho stdin False) (hSetEcho stdin old) action

fileToModule :: FilePath -> FilePath -> IO SourceModule
fileToModule dir file = do
    content <- readFile (dir </> file)
    return SourceModule
        { name = pack . Prelude.drop 2 . maybe file id $ stripExtension ".js" file
        , content = content
        }

findJs :: FilePath -> IO [FilePath]
findJs dir = withCurrentDirectory dir $ do
    res <- find always (extension ==? ".js") "./"
    putStrLn "Using files:"
    print res
    return res

data SourcePushReq = SourcePushReq
    { branch :: Text
    , modules :: [SourceModule]
    }

instance ToJSON SourcePushReq where
    toJSON SourcePushReq{..} = object
        [ "branch" .= branch
        , "modules" .= object (fmap mkModule modules)
        ]
      where
        mkModule :: SourceModule -> Pair
        mkModule SourceModule{..} = name .= content

data SourceModule = SourceModule
    { name :: Text
    , content :: String
    }
