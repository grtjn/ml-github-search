#
# Put your custom functions in this class in order to keep the files under lib untainted
#
# This class has access to all of the private variables in deploy/lib/server_config.rb
#
# any public method you create here can be called from the command line. See
# the examples below for more information.
#
class ServerConfig

  alias_method :original_deploy_modules, :deploy_modules

  def deploy_modules
    deploy_packages
    original_deploy_modules
    fix_permissions
  end
  
  def deploy_packages
    password_prompt
    system %Q!mlpm deploy -u #{ @ml_username } \
                          -p #{ @ml_password } \
                          -H #{ @properties['ml.server'] } \
                          -P #{ @properties['ml.app-port'] }!
  end
  
  def fix_permissions
    # and apply correct permissions
    r = execute_query %Q{
      xquery version "1.0-ml";

      for $uri in cts:uris()
      where not(ends-with($uri, "/"))
      return (
        $uri,
        xdmp:document-set-permissions($uri, (
          xdmp:permission("#{@properties["ml.app-name"]}-role", "read"),
          xdmp:permission("#{@properties["ml.app-name"]}-role", "execute")
        ))
      )
    },
    { :db_name => @properties["ml.modules-db"] }

    r.body = parse_json r.body
    logger.info r.body
  end
  
  def update_repos
    @properties['ml.http.read-timeout'] = 1800; # 30 min.
    
    # re-initialize to make sure http settings get applied
    initialize(@options) 
    
    r = execute_query %Q{
        xdmp:invoke("/ext/mlpm_modules/ml-github-api/update-repos.xqy")
      },
      { :app_name => @properties["ml.app-name"] }

    r.body = parse_json r.body
    logger.info r.body
  end

end

#
# Uncomment, and adjust below code to get help about your app_specific
# commands included into Roxy help. (ml -h)
#

#class Help
#  def self.app_specific
#    <<-DOC.strip_heredoc
#
#      App-specific commands:
#        example       Installs app-specific alerting
#    DOC
#  end
#
#  def self.example
#    <<-DOC.strip_heredoc
#      Usage: ml {env} example [args] [options]
#      
#      Runs a special example task against given environment.
#      
#      Arguments:
#        this    Do this
#        that    Do that
#        
#      Options:
#        --whatever=value
#    DOC
#  end
#end
